BEGIN;
-- Free course pilot. Apply after 066. Unlisted Academy courses are unaffected.
INSERT INTO public.feature_flags(key,label,description,enabled,category)
VALUES ('course_pilot_enabled','Public course pilot','Public courses, ten free places, and learner community.',false,'Growth / Beta')
ON CONFLICT(key) DO NOTHING;

CREATE TABLE public.course_pilot_listings (
 course_id uuid PRIMARY KEY REFERENCES public.academy_courses(id),
 listed boolean NOT NULL DEFAULT false,
 outcomes text NOT NULL DEFAULT '', prerequisites text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.course_pilot_memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 course_id uuid NOT NULL REFERENCES public.academy_courses(id),
 user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 status text NOT NULL CHECK(status IN ('enrolled','waitlisted')),
 created_at timestamptz NOT NULL DEFAULT now(), enrolled_at timestamptz,
 UNIQUE(course_id,user_id)
);
CREATE INDEX course_pilot_enrolled_places ON public.course_pilot_memberships(course_id) WHERE status='enrolled';
CREATE INDEX course_pilot_learner_memberships ON public.course_pilot_memberships(user_id,status);
CREATE TABLE public.course_pilot_notes (
 course_id uuid NOT NULL REFERENCES public.academy_courses(id),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 lesson_slug text NOT NULL DEFAULT '', body text NOT NULL CHECK(char_length(body)<=10000),
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(course_id,user_id,lesson_slug)
);
CREATE TABLE public.course_pilot_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES public.academy_courses(id),
 author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 lesson_slug text NOT NULL DEFAULT '', parent_id uuid REFERENCES public.course_pilot_posts(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(char_length(trim(body)) BETWEEN 1 AND 4000),
 hidden boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX course_pilot_posts_course ON public.course_pilot_posts(course_id,created_at);
CREATE TABLE public.course_pilot_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES public.course_pilot_posts(id) ON DELETE CASCADE,
 reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK(char_length(trim(reason)) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(post_id,reporter_id)
);
CREATE TABLE public.course_pilot_reviews (
 course_id uuid NOT NULL REFERENCES public.academy_courses(id),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), body text NOT NULL DEFAULT '' CHECK(char_length(body)<=2000),
 hidden boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(course_id,user_id)
);

CREATE FUNCTION public.course_pilot_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin' AND NOT coalesce(is_suspended,false));
$$;
-- Legacy permissive admin policies must also use the trusted profile role.
-- Auth user_metadata is editable by the account holder.
CREATE OR REPLACE FUNCTION public.current_user_is_academy_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.course_pilot_admin();
$$;
CREATE FUNCTION public.course_pilot_active() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND NOT coalesce(is_suspended,false))
 AND EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL AND coalesce(raw_user_meta_data->>'is_suspended','false') <> 'true');
$$;
CREATE FUNCTION public.course_pilot_enabled() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce((SELECT enabled FROM feature_flags WHERE key='course_pilot_enabled'),false);
$$;
CREATE FUNCTION public.course_pilot_enrolled(target uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.course_pilot_active() AND public.course_pilot_enabled() AND EXISTS(
 SELECT 1 FROM course_pilot_memberships WHERE course_id=target AND user_id=auth.uid() AND status='enrolled');
$$;
CREATE FUNCTION public.course_pilot_can_access(target uuid, audiences text[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.course_pilot_admin() OR CASE WHEN EXISTS(SELECT 1 FROM course_pilot_listings WHERE course_id=target)
 THEN public.course_pilot_enrolled(target) ELSE public.current_user_matches_academy_audience(audiences) END;
$$;
DROP POLICY "Eligible users read published academy courses" ON public.academy_courses;
CREATE POLICY "Eligible users read published academy courses" ON public.academy_courses FOR SELECT USING (
 status='published' AND public.course_pilot_can_access(id,audience_roles));
DROP POLICY "Eligible users read published academy versions" ON public.academy_course_versions;
CREATE POLICY "Eligible users read published academy versions" ON public.academy_course_versions FOR SELECT USING (
 EXISTS(SELECT 1 FROM academy_courses c WHERE c.id=course_id AND c.status='published'
 AND c.published_version_id=academy_course_versions.id AND public.course_pilot_can_access(c.id,c.audience_roles)));

ALTER TABLE public.course_pilot_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pilot_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pilot_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pilot_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pilot_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pilot_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pilot admin listings" ON public.course_pilot_listings FOR ALL TO authenticated USING(public.course_pilot_admin()) WITH CHECK(public.course_pilot_admin());
CREATE POLICY "Pilot membership read" ON public.course_pilot_memberships FOR SELECT TO authenticated USING(public.course_pilot_admin() OR (user_id=auth.uid() AND public.course_pilot_active()));
CREATE POLICY "Pilot private notes" ON public.course_pilot_notes FOR ALL TO authenticated USING(user_id=auth.uid() AND public.course_pilot_enrolled(course_id)) WITH CHECK(user_id=auth.uid() AND public.course_pilot_enrolled(course_id));
CREATE FUNCTION public.course_pilot_parent_visible(target uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM course_pilot_posts WHERE id=target AND NOT hidden);
$$;
CREATE POLICY "Pilot discussion read" ON public.course_pilot_posts FOR SELECT TO authenticated USING(public.course_pilot_admin() OR (NOT hidden AND public.course_pilot_enrolled(course_id) AND (parent_id IS NULL OR public.course_pilot_parent_visible(parent_id))));
CREATE POLICY "Pilot reports admin read" ON public.course_pilot_reports FOR SELECT TO authenticated USING(public.course_pilot_admin());
CREATE POLICY "Pilot review read" ON public.course_pilot_reviews FOR SELECT TO authenticated USING(public.course_pilot_admin() OR (user_id=auth.uid() AND public.course_pilot_enrolled(course_id)));
CREATE POLICY "Pilot moderation posts" ON public.course_pilot_posts FOR UPDATE TO authenticated USING(public.course_pilot_admin()) WITH CHECK(public.course_pilot_admin());
CREATE POLICY "Pilot moderation reviews" ON public.course_pilot_reviews FOR UPDATE TO authenticated USING(public.course_pilot_admin()) WITH CHECK(public.course_pilot_admin());

-- Public data is an explicit projection of the published version, never draft/lesson blocks.
CREATE FUNCTION public.course_pilot_catalog(target_key text DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'id',c.id,'key',c.course_key,'title',v.content->>'title','description',v.content->>'description',
 'heroImage',v.content->>'heroImage','estimatedMinutes',v.content->'estimatedMinutes',
 'outcomes',l.outcomes,'prerequisites',l.prerequisites,
 'curriculum',(SELECT coalesce(jsonb_agg(jsonb_build_object('title',lesson->>'title')),'[]'::jsonb) FROM jsonb_array_elements(v.content->'lessons') lesson),
 'placesRemaining',greatest(0,10-(SELECT count(*) FROM course_pilot_memberships m WHERE m.course_id=c.id AND m.status='enrolled')),
 'reviews',(SELECT coalesce(jsonb_agg(jsonb_build_object('rating',r.rating,'body',r.body,'name',coalesce(p.full_name,'Learner')) ORDER BY r.updated_at DESC),'[]'::jsonb)
 FROM course_pilot_reviews r LEFT JOIN profiles p ON p.id=r.user_id WHERE r.course_id=c.id AND NOT r.hidden)
 ) ORDER BY c.published_at),'[]'::jsonb)
 FROM course_pilot_listings l JOIN academy_courses c ON c.id=l.course_id
 JOIN academy_course_versions v ON v.id=c.published_version_id
 WHERE l.listed AND c.status='published' AND public.course_pilot_enabled() AND (target_key IS NULL OR c.course_key=target_key);
$$;

CREATE FUNCTION public.course_pilot_join(target_key text, waitlist_only boolean DEFAULT false) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; existing text; result text;
BEGIN
 IF NOT public.course_pilot_active() OR NOT public.course_pilot_enabled() THEN RAISE EXCEPTION 'A verified active account is required'; END IF;
 -- Serialize claims and admin promotions on the same course row.
 SELECT c.id INTO target FROM academy_courses c JOIN course_pilot_listings l ON l.course_id=c.id
 WHERE c.course_key=target_key AND c.status='published' AND l.listed FOR UPDATE OF c;
 IF target IS NULL THEN RAISE EXCEPTION 'Course is not open for enrollment'; END IF;
 SELECT status INTO existing FROM course_pilot_memberships WHERE course_id=target AND user_id=auth.uid();
 IF existing IS NOT NULL THEN RETURN existing; END IF;
 IF (SELECT count(*) FROM course_pilot_memberships WHERE course_id=target AND status='enrolled') < 10 THEN
   IF waitlist_only THEN RAISE EXCEPTION 'Places are available. Enroll to claim a place.'; END IF;
   result := 'enrolled';
 ELSE result := 'waitlisted'; END IF;
 INSERT INTO course_pilot_memberships(course_id,user_id,status,enrolled_at) VALUES(target,auth.uid(),result,CASE WHEN result='enrolled' THEN now() END);
 RETURN result;
END;
$$;
CREATE FUNCTION public.course_pilot_promote(target uuid, learner uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.course_pilot_admin() OR NOT public.course_pilot_enabled() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 PERFORM 1 FROM academy_courses WHERE id=target AND status='published' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Published course required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users u JOIN profiles p ON p.id=u.id WHERE u.id=learner AND u.email_confirmed_at IS NOT NULL AND coalesce(u.raw_user_meta_data->>'is_suspended','false') <> 'true' AND NOT coalesce(p.is_suspended,false)) THEN RAISE EXCEPTION 'Active verified learner required'; END IF;
 IF (SELECT count(*) FROM course_pilot_memberships WHERE course_id=target AND status='enrolled') >= 10 THEN RAISE EXCEPTION 'All ten places are filled'; END IF;
 UPDATE course_pilot_memberships SET status='enrolled',enrolled_at=now() WHERE course_id=target AND user_id=learner AND status='waitlisted';
 IF NOT FOUND THEN RAISE EXCEPTION 'Waitlist entry not found'; END IF;
END;
$$;
CREATE FUNCTION public.course_pilot_valid_lesson(target uuid, slug text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT slug='' OR EXISTS(SELECT 1 FROM academy_courses c JOIN academy_course_versions v ON v.id=c.published_version_id,
 jsonb_array_elements(v.content->'lessons') lesson WHERE c.id=target AND lesson->>'slug'=slug);
$$;
CREATE FUNCTION public.course_pilot_note_scope() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.course_pilot_valid_lesson(NEW.course_id,NEW.lesson_slug) THEN RAISE EXCEPTION 'Unknown lesson'; END IF;
 NEW.updated_at=now(); RETURN NEW;
END;
$$;
CREATE TRIGGER course_pilot_note_scope BEFORE INSERT OR UPDATE ON public.course_pilot_notes FOR EACH ROW EXECUTE FUNCTION public.course_pilot_note_scope();
CREATE FUNCTION public.course_pilot_post(target uuid, message text, slug text DEFAULT '', reply_to uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.course_pilot_enrolled(target) THEN RAISE EXCEPTION 'Enrollment required'; END IF;
 IF NOT public.course_pilot_valid_lesson(target,slug) THEN RAISE EXCEPTION 'Unknown lesson'; END IF;
 IF reply_to IS NOT NULL AND NOT EXISTS(SELECT 1 FROM course_pilot_posts WHERE id=reply_to AND course_id=target AND parent_id IS NULL AND lesson_slug=slug AND NOT hidden) THEN RAISE EXCEPTION 'Invalid discussion reply'; END IF;
 INSERT INTO course_pilot_posts(course_id,author_id,body,lesson_slug,parent_id) VALUES(target,auth.uid(),trim(message),slug,reply_to);
END;
$$;
CREATE FUNCTION public.course_pilot_report(target_post uuid, report_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid;
BEGIN
 SELECT course_id INTO target FROM course_pilot_posts WHERE id=target_post AND NOT hidden;
 IF target IS NULL OR NOT public.course_pilot_enrolled(target) THEN RAISE EXCEPTION 'Enrollment required'; END IF;
 INSERT INTO course_pilot_reports(post_id,reporter_id,reason) VALUES(target_post,auth.uid(),trim(report_reason)) ON CONFLICT(post_id,reporter_id) DO NOTHING;
END;
$$;
CREATE FUNCTION public.course_pilot_review(target uuid, stars integer, review_body text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.course_pilot_enrolled(target) OR NOT EXISTS(SELECT 1 FROM tutor_academy_progress p JOIN academy_courses c ON c.course_key=p.course_key
 WHERE c.id=target AND p.user_id=auth.uid() AND (cardinality(p.completed_lessons)>0 OR cardinality(p.completed_lesson_ids)>0)) THEN RAISE EXCEPTION 'Complete a lesson before reviewing'; END IF;
 INSERT INTO course_pilot_reviews(course_id,user_id,rating,body) VALUES(target,auth.uid(),stars,trim(review_body))
 ON CONFLICT(course_id,user_id) DO UPDATE SET rating=excluded.rating,body=excluded.body,updated_at=now();
END;
$$;
CREATE FUNCTION public.course_pilot_authors(target uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'avatar',p.avatar_url)),'[]'::jsonb)
 FROM profiles p WHERE (public.course_pilot_enrolled(target) OR public.course_pilot_admin()) AND p.id IN
 (SELECT author_id FROM course_pilot_posts WHERE course_id=target AND NOT hidden UNION SELECT user_id FROM course_pilot_memberships WHERE course_id=target AND public.course_pilot_admin());
$$;
-- No direct membership/post/review/report writes; the functions enforce scope and immutable ownership.
REVOKE ALL ON FUNCTION public.course_pilot_join(text,boolean),public.course_pilot_promote(uuid,uuid),public.course_pilot_post(uuid,text,text,uuid),public.course_pilot_report(uuid,text),public.course_pilot_review(uuid,integer,text),public.course_pilot_authors(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.course_pilot_join(text,boolean),public.course_pilot_promote(uuid,uuid),public.course_pilot_post(uuid,text,text,uuid),public.course_pilot_report(uuid,text),public.course_pilot_review(uuid,integer,text),public.course_pilot_authors(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.course_pilot_catalog(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.course_pilot_catalog(text) TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.course_pilot_listings,public.course_pilot_notes TO authenticated;
GRANT SELECT ON public.course_pilot_memberships,public.course_pilot_reports TO authenticated;
GRANT SELECT,UPDATE ON public.course_pilot_posts,public.course_pilot_reviews TO authenticated;
NOTIFY pgrst,'reload schema';
-- Resolve pilot access even when course RLS correctly hides an unenrolled course.
CREATE FUNCTION public.course_pilot_access(target_key text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('managed',EXISTS(SELECT 1 FROM course_pilot_listings l JOIN academy_courses c ON c.id=l.course_id WHERE c.course_key=target_key),
 'allowed',EXISTS(SELECT 1 FROM course_pilot_listings l JOIN academy_courses c ON c.id=l.course_id WHERE c.course_key=target_key AND c.status='published'
 AND public.course_pilot_enabled() AND (public.course_pilot_enrolled(c.id) OR public.course_pilot_admin())));
$$;
REVOKE ALL ON FUNCTION public.course_pilot_access(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.course_pilot_access(text) TO anon,authenticated;
NOTIFY pgrst,'reload schema';

COMMIT;
