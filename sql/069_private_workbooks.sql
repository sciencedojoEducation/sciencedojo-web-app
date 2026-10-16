BEGIN;
-- Private workbook access is independent of public course enrolment or account role.
CREATE TABLE public.workbook_memberships (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 book_key text NOT NULL CHECK(book_key='aspekte-neu-b2'), active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,book_key)
);
CREATE FUNCTION public.workbook_member(target text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM workbook_memberships m JOIN profiles p ON p.id=m.user_id
 JOIN auth.users u ON u.id=m.user_id WHERE m.user_id=auth.uid() AND m.book_key=target AND m.active
 AND NOT coalesce(p.is_suspended,false) AND u.email_confirmed_at IS NOT NULL
 AND coalesce(u.raw_user_meta_data->>'is_suspended','false')<>'true');
$$;
CREATE FUNCTION public.workbook_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM profiles p JOIN auth.users u ON u.id=p.id WHERE p.id=auth.uid()
 AND p.role='admin' AND NOT coalesce(p.is_suspended,false) AND u.email_confirmed_at IS NOT NULL);
$$;
CREATE TABLE public.workbook_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), book_key text NOT NULL CHECK(book_key='aspekte-neu-b2'),
 email text NOT NULL CHECK(email=lower(email)), token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL, redeemed_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 redeemed_at timestamptz, revoked_at timestamptz, created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.workbook_learning_states (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 book_key text NOT NULL CHECK(book_key='aspekte-neu-b2'), revision bigint NOT NULL DEFAULT 0,
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,book_key)
);
CREATE TABLE public.workbook_recordings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 book_key text NOT NULL CHECK(book_key='aspekte-neu-b2'), exercise_key text NOT NULL, run_id text NOT NULL,
 storage_path text NOT NULL UNIQUE, cleanup_paths text[] NOT NULL DEFAULT '{}', mime_type text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,book_key,exercise_key,run_id)
);
CREATE TABLE public.workbook_feedback_requests (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, requested_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workbook_feedback_user_time ON public.workbook_feedback_requests(user_id,requested_at);
ALTER TABLE public.workbook_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_learning_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbook_feedback_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.workbook_memberships,public.workbook_invitations,public.workbook_learning_states,public.workbook_recordings TO authenticated;
-- All writes pass server validation. Even the owner cannot submit a fabricated score through REST.
CREATE POLICY "Workbook membership visibility" ON public.workbook_memberships FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.workbook_admin());
CREATE POLICY "Workbook admin invitations" ON public.workbook_invitations FOR SELECT TO authenticated USING(public.workbook_admin());
CREATE POLICY "Workbook own progress" ON public.workbook_learning_states FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.workbook_member(book_key));
CREATE POLICY "Workbook own recordings" ON public.workbook_recordings FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.workbook_member(book_key));

-- Service-only compare-and-swap keeps submitted history and scheduling atomic across devices.
CREATE FUNCTION public.workbook_save_state(target_user uuid,target_book text,expected_revision bigint,next_payload jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
 INSERT INTO workbook_learning_states(user_id,book_key,payload) VALUES(target_user,target_book,'{}') ON CONFLICT DO NOTHING;
 UPDATE workbook_learning_states SET payload=next_payload,revision=revision+1,updated_at=now()
 WHERE user_id=target_user AND book_key=target_book AND revision=expected_revision;
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed=1;
END;
$$;
CREATE FUNCTION public.workbook_redeem_invitation(target_user uuid,invitation_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE invitation workbook_invitations; learner auth.users;
BEGIN
 SELECT * INTO learner FROM auth.users WHERE id=target_user;
 IF learner.id IS NULL OR learner.email_confirmed_at IS NULL OR coalesce(learner.raw_user_meta_data->>'is_suspended','false')='true' THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=target_user AND NOT coalesce(is_suspended,false)) THEN RETURN false; END IF;
 SELECT * INTO invitation FROM workbook_invitations WHERE token_hash=invitation_hash FOR UPDATE;
 IF invitation.id IS NULL OR invitation.expires_at<=now() OR invitation.revoked_at IS NOT NULL
 OR invitation.redeemed_at IS NOT NULL OR invitation.email<>lower(learner.email) THEN RETURN false; END IF;
 INSERT INTO workbook_memberships(user_id,book_key,active) VALUES(target_user,invitation.book_key,true)
 ON CONFLICT(user_id,book_key) DO UPDATE SET active=true;
 UPDATE workbook_invitations SET redeemed_by=target_user,redeemed_at=now() WHERE id=invitation.id;
 RETURN true;
END;
$$;
CREATE FUNCTION public.workbook_feedback_quota(target_user uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE minute_count integer; hour_count integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(target_user::text,721));
 SELECT count(*) FILTER(WHERE requested_at>now()-interval '1 minute'),count(*) INTO minute_count,hour_count
 FROM workbook_feedback_requests WHERE user_id=target_user AND requested_at>now()-interval '1 hour';
 IF minute_count>=5 OR hour_count>=30 THEN RETURN false; END IF;
 DELETE FROM workbook_feedback_requests WHERE user_id=target_user AND requested_at<now()-interval '1 day';
 INSERT INTO workbook_feedback_requests(user_id) VALUES(target_user); RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.workbook_save_state(uuid,text,bigint,jsonb),public.workbook_redeem_invitation(uuid,text),public.workbook_feedback_quota(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.workbook_save_state(uuid,text,bigint,jsonb),public.workbook_redeem_invitation(uuid,text),public.workbook_feedback_quota(uuid) TO service_role;
GRANT ALL ON public.workbook_memberships,public.workbook_invitations,public.workbook_learning_states,public.workbook_recordings,public.workbook_feedback_requests TO service_role;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('private-workbooks','private-workbooks',false,52428800,ARRAY['application/json','image/jpeg','audio/mp4']),
 ('workbook-recordings','workbook-recordings',false,10485760,ARRAY['audio/webm','audio/mp4','audio/ogg'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
-- Private source objects and recording blobs are served only by the authorized server;
-- there is deliberately no anonymous/public storage policy or learner write policy.
NOTIFY pgrst,'reload schema';
COMMIT;
