BEGIN;
-- Additive, disabled by default. Requires 067's course authorization helpers.
-- Normally follows 069; isolated campus staging does not depend on unrelated 068/069 schemas.
INSERT INTO public.feature_flags(key,label,description,enabled,category)
VALUES('virtual_campus_enabled','Virtual campus','Invite-only adult shared study library.',false,'Growth / Beta') ON CONFLICT(key) DO NOTHING;

-- Campus authority is explicitly provisioned by a trusted operator;
-- an existing account profile alone does not establish campus staff permission.
CREATE TABLE public.campus_staff (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campus_staff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_staff FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.campus_staff TO service_role;
CREATE FUNCTION public.campus_is_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.course_pilot_admin() AND public.course_pilot_active()
 AND EXISTS(SELECT 1 FROM campus_staff WHERE user_id=auth.uid() AND enabled);
$$;
-- Restrictive write policies protect this one switch even alongside legacy
-- permissive feature-flag policies. Public flag reads retain their existing behavior.
CREATE POLICY "Campus flag insert staff" ON public.feature_flags AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(key<>'virtual_campus_enabled' OR public.campus_is_staff());
CREATE POLICY "Campus flag update staff" ON public.feature_flags AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(key<>'virtual_campus_enabled' OR public.campus_is_staff())
 WITH CHECK(key<>'virtual_campus_enabled' OR public.campus_is_staff());
CREATE POLICY "Campus flag delete staff" ON public.feature_flags AS RESTRICTIVE FOR DELETE TO authenticated
 USING(key<>'virtual_campus_enabled' OR public.campus_is_staff());

CREATE TABLE public.campus_members (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 campus_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
 pseudonym text NOT NULL DEFAULT ('Quiet Maple ' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
 colour integer NOT NULL DEFAULT 0 CHECK(colour BETWEEN 0 AND 4),
 enabled boolean NOT NULL DEFAULT false, adult_verified boolean NOT NULL DEFAULT false, eea_verified boolean NOT NULL DEFAULT false,
 verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, verified_at timestamptz,
 accepted_notice text, accepted_at timestamptz, last_admission timestamptz
);
CREATE TABLE public.campus_tickets (
 token_hash text PRIMARY KEY CHECK(token_hash ~ '^[0-9a-f]{64}$'),
 campus_id uuid NOT NULL REFERENCES public.campus_members(campus_id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '60 seconds'
);
CREATE TABLE public.campus_blocks (
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 target uuid NOT NULL REFERENCES public.campus_members(campus_id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner_id,target)
);
CREATE TABLE public.campus_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 target uuid REFERENCES public.campus_members(campus_id) ON DELETE SET NULL,
 reason text NOT NULL CHECK(reason IN ('harassment','inappropriate-behaviour','technical','other')),
 created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz,
 resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE TABLE public.campus_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 target uuid REFERENCES public.campus_members(campus_id) ON DELETE SET NULL,
 action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campus_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campus staff read members" ON public.campus_members FOR SELECT TO authenticated USING(public.campus_is_staff());
CREATE POLICY "Campus own blocks" ON public.campus_blocks FOR SELECT TO authenticated USING(owner_id=auth.uid() AND public.course_pilot_active());
CREATE POLICY "Campus staff read reports" ON public.campus_reports FOR SELECT TO authenticated USING(public.campus_is_staff());
CREATE POLICY "Campus staff read audit" ON public.campus_audit FOR SELECT TO authenticated USING(public.campus_is_staff());
REVOKE ALL ON public.campus_members,public.campus_tickets,public.campus_blocks,public.campus_reports,public.campus_audit FROM anon,authenticated;
GRANT SELECT ON public.campus_members,public.campus_blocks,public.campus_reports,public.campus_audit TO authenticated;

CREATE FUNCTION public.campus_allowed(target uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce((SELECT enabled FROM feature_flags WHERE key='virtual_campus_enabled'),false)
 AND EXISTS(SELECT 1 FROM campus_members m JOIN profiles p ON p.id=m.user_id JOIN auth.users u ON u.id=m.user_id
 WHERE m.campus_id=target AND m.enabled AND m.adult_verified AND m.eea_verified AND m.verified_at IS NOT NULL
 AND m.accepted_notice='campus-adult-pilot-v1' AND NOT coalesce(p.is_suspended,false)
 AND u.email_confirmed_at IS NOT NULL AND coalesce(u.raw_user_meta_data->>'is_suspended','false')<>'true');
$$;
CREATE FUNCTION public.campus_accept_notice(notice text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF notice <> 'campus-adult-pilot-v1' OR NOT public.course_pilot_active() THEN RAISE EXCEPTION 'Active verified account required'; END IF;
 UPDATE campus_members SET accepted_notice=notice,accepted_at=now() WHERE user_id=auth.uid() AND enabled AND adult_verified AND eea_verified;
 IF NOT FOUND THEN RAISE EXCEPTION 'Campus invitation required'; END IF;
END;
$$;
CREATE FUNCTION public.campus_self() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('id',m.campus_id,'pseudonym',m.pseudonym,'colour',m.colour,'accepted',m.accepted_notice='campus-adult-pilot-v1',
 'blocked',coalesce((SELECT jsonb_agg(b.target) FROM campus_blocks b WHERE b.owner_id=m.user_id),'[]'::jsonb))
 FROM campus_members m WHERE m.user_id=auth.uid() AND public.course_pilot_active() AND m.enabled AND m.adult_verified AND m.eea_verified;
$$;
CREATE FUNCTION public.campus_issue_ticket(ticket_hash text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m campus_members;
BEGIN
 SELECT * INTO m FROM campus_members WHERE user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR NOT public.campus_allowed(m.campus_id) THEN RAISE EXCEPTION 'Campus unavailable'; END IF;
 IF m.last_admission > now()-interval '3 seconds' THEN RAISE EXCEPTION 'Please wait before reconnecting'; END IF;
 DELETE FROM campus_tickets WHERE campus_id=m.campus_id OR expires_at<now();
 INSERT INTO campus_tickets(token_hash,campus_id) VALUES(ticket_hash,m.campus_id);
 UPDATE campus_members SET last_admission=now() WHERE user_id=auth.uid();
END;
$$;
CREATE FUNCTION public.campus_service_identity(target uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('id',m.campus_id,'pseudonym',m.pseudonym,'colour',m.colour,
 'blocked',coalesce((SELECT jsonb_agg(b.target) FROM campus_blocks b WHERE b.owner_id=m.user_id),'[]'::jsonb))
 FROM campus_members m WHERE m.campus_id=target AND public.campus_allowed(target);
$$;
CREATE FUNCTION public.campus_redeem_ticket(ticket_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid;
BEGIN
 DELETE FROM campus_tickets WHERE token_hash=ticket_hash AND expires_at>now() RETURNING campus_id INTO target;
 IF target IS NULL THEN RETURN NULL; END IF;
 RETURN public.campus_service_identity(target);
END;
$$;
CREATE FUNCTION public.campus_block(target_id uuid, blocked boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE own uuid;
BEGIN
 SELECT campus_id INTO own FROM campus_members WHERE user_id=auth.uid();
 IF NOT public.campus_allowed(own) OR own=target_id THEN RAISE EXCEPTION 'Campus access required'; END IF;
 IF blocked THEN INSERT INTO campus_blocks(owner_id,target) VALUES(auth.uid(),target_id) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM campus_blocks WHERE owner_id=auth.uid() AND target=target_id; END IF;
END;
$$;
CREATE FUNCTION public.campus_report(target_id uuid, report_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE own uuid;
BEGIN
 SELECT campus_id INTO own FROM campus_members WHERE user_id=auth.uid();
 IF NOT public.campus_allowed(own) OR own=target_id THEN RAISE EXCEPTION 'Campus access required'; END IF;
 -- Serialize per reporter so parallel submissions cannot bypass the limit.
 PERFORM 1 FROM campus_members WHERE user_id=auth.uid() FOR UPDATE;
 IF (SELECT count(*) FROM campus_reports WHERE reporter_id=auth.uid() AND created_at>now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'Report limit reached; contact the session supervisor'; END IF;
 INSERT INTO campus_reports(reporter_id,target,reason) VALUES(auth.uid(),target_id,report_reason);
END;
$$;
CREATE FUNCTION public.campus_manage_member(target_user uuid, active boolean, adult boolean, eea boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE campus uuid;
BEGIN
 IF NOT public.campus_is_staff() THEN RAISE EXCEPTION 'Admin campus staff required'; END IF;
 IF active AND NOT(adult AND eea) THEN RAISE EXCEPTION 'Reviewed adult and EU/EEA eligibility required'; END IF;
 INSERT INTO campus_members(user_id,enabled,adult_verified,eea_verified,verified_by,verified_at,colour)
 VALUES(target_user,active,adult,eea,auth.uid(),now(),floor(random()*5)::int)
 ON CONFLICT(user_id) DO UPDATE SET enabled=active,adult_verified=adult,eea_verified=eea,verified_by=auth.uid(),verified_at=now();
 SELECT campus_id INTO campus FROM campus_members WHERE user_id=target_user;
 DELETE FROM campus_tickets WHERE campus_id=campus;
 INSERT INTO campus_audit(actor,target,action) VALUES(auth.uid(),campus,CASE WHEN active THEN 'membership-approved' ELSE 'membership-revoked' END);
END;
$$;
CREATE FUNCTION public.campus_resolve_report(target_report uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.campus_is_staff() THEN RAISE EXCEPTION 'Admin campus staff required'; END IF;
 UPDATE campus_reports SET resolved_at=now(),resolved_by=auth.uid() WHERE id=target_report;
 INSERT INTO campus_audit(actor,target,action) SELECT auth.uid(),target,'report-resolved' FROM campus_reports WHERE id=target_report;
END;
$$;
REVOKE ALL ON FUNCTION public.campus_is_staff(),public.campus_allowed(uuid),public.campus_self(),public.campus_accept_notice(text),public.campus_issue_ticket(text),public.campus_block(uuid,boolean),public.campus_report(uuid,text),public.campus_manage_member(uuid,boolean,boolean,boolean),public.campus_resolve_report(uuid),public.campus_service_identity(uuid),public.campus_redeem_ticket(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_is_staff(),public.campus_self(),public.campus_accept_notice(text),public.campus_issue_ticket(text),public.campus_block(uuid,boolean),public.campus_report(uuid,text),public.campus_manage_member(uuid,boolean,boolean,boolean),public.campus_resolve_report(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.campus_service_identity(uuid),public.campus_redeem_ticket(text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
