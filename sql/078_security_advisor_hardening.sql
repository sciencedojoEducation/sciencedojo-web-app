-- Security hardening, independent of optional game migration 077.
-- No account, learning, file, feature-flag or membership data is changed.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Existing public-schema code may use unqualified application relations.
-- Pin catalog resolution first and temp relations last; public is not writable
-- by either API role. Abort instead of trusting a writable application schema.
DO $guard$
BEGIN
  IF has_schema_privilege('anon','public','CREATE') OR
     has_schema_privilege('authenticated','public','CREATE') THEN
    RAISE EXCEPTION 'public schema must not be writable by API roles';
  END IF;
  IF to_regprocedure('public.course_pilot_admin()') IS NULL OR
     to_regprocedure('storage.allow_any_operation(text[])') IS NULL THEN
    RAISE EXCEPTION 'Required trusted authorization/storage helpers are missing';
  END IF;
END $guard$;

ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.check_single_row_limit() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.handle_new_message() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.handle_dispute_insert() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.set_assessment_leads_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.sciencedojo_slugify(text) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.set_tutor_slug() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.touch_feature_flags_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.touch_internal_team_members_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.set_account_membership_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.set_subscription_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.community_touch_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.prevent_booking_learning_context_rewrite() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.touch_internal_projects_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.prevent_academy_version_changes() SET search_path = pg_catalog, public, pg_temp;

-- Signup metadata may choose a public signup path, never a privileged role.
-- Missing OAuth role still leaves provisioning to the existing callback.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $function$
DECLARE app_role text := NEW.raw_user_meta_data->>'role';
BEGIN
  IF app_role IS NULL OR app_role NOT IN ('user','parent','student','tutor') THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.profiles(id,full_name,email,avatar_url,role,student_name)
  VALUES(NEW.id,NEW.raw_user_meta_data->>'full_name',lower(NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',app_role,NEW.raw_user_meta_data->>'student_name');
  IF app_role='tutor' THEN
    INSERT INTO public.tutors(id,bio,subjects,hourly_rate,is_verified)
    VALUES(NEW.id,'','{}',0,false);
  END IF;
  RETURN NEW;
END $function$;

-- Reuse the active database-role check already used by Academy/campus.
CREATE OR REPLACE FUNCTION public.is_admin_profile()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $function$
  SELECT public.course_pilot_admin();
$function$;

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp AS $function$
BEGIN
  -- This is the actual SQL role, not editable user metadata. Trigger execution
  -- does not change the role GUC even though this function is SECURITY DEFINER.
  IF current_setting('role',true) IN ('postgres','service_role','supabase_admin','supabase_auth_admin')
     OR (current_setting('role',true) IN ('none','') AND session_user IN ('postgres','supabase_admin'))
     OR public.course_pilot_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role AND
     (NEW.role IN ('admin','internal') OR OLD.role IN ('admin','internal')) THEN
    RAISE EXCEPTION 'Not authorized to change privileged profile role' USING ERRCODE='42501';
  END IF;
  IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended OR
     NEW.warning_count IS DISTINCT FROM OLD.warning_count THEN
    RAISE EXCEPTION 'Not authorized to change profile safety fields' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $function$;

ALTER POLICY "Admin Global Update" ON public.bookings
  USING(public.course_pilot_admin()) WITH CHECK(public.course_pilot_admin());
ALTER POLICY "Admin Profile Access" ON public.profiles
  USING(public.course_pilot_admin()) WITH CHECK(public.course_pilot_admin());
ALTER POLICY "Users limited view" ON public.announcements
  USING(is_active=true AND (target_role='all' OR target_role=(SELECT p.role FROM public.profiles p WHERE p.id=auth.uid())));
ALTER POLICY "Authenticated users can view basic profiles" ON public.profiles
  USING(auth.uid()=id OR public.course_pilot_admin()
    OR (NOT public.is_active_internal_member(auth.uid()) AND role IS DISTINCT FROM 'internal')
    OR (public.is_active_internal_member(auth.uid()) AND (role='admin' OR public.is_active_internal_member(id))));
ALTER POLICY "Admins can insert feature flags" ON public.feature_flags
  WITH CHECK(public.course_pilot_admin());
ALTER POLICY "Admins can update feature flags" ON public.feature_flags
  USING(public.course_pilot_admin()) WITH CHECK(public.course_pilot_admin());
ALTER POLICY "Admins can delete feature flags" ON public.feature_flags
  USING(public.course_pilot_admin());
ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK(auth.uid()=id AND role IN ('user','parent','student','tutor')
    AND NOT coalesce(is_suspended,false) AND coalesce(warning_count,0)=0);

-- This legacy policy queried profiles from inside a profiles UPDATE policy.
-- Use the nonrecursive, active-admin helper instead.
ALTER POLICY "Admins can manage safety metrics" ON public.profiles
  USING(public.course_pilot_admin()) WITH CHECK(public.course_pilot_admin());

-- Trigger functions are invoked by attached triggers, never as public RPCs.
-- Revoking EXECUTE does not detach or disable existing triggers.
DO $triggers$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prorettype='trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
  END LOOP;
END $triggers$;
-- Rating aggregation is used by its trigger and the existing trusted backend.
REVOKE EXECUTE ON FUNCTION public.recalculate_tutor_rating(uuid) FROM PUBLIC,anon,authenticated;

-- Public download URLs keep working. Listing is limited to the file owner or
-- an existing active admin; application media browsing uses the service client.
ALTER POLICY "Academy media is publicly readable" ON storage.objects
  USING(bucket_id='academy-media' AND (
    storage.allow_any_operation(ARRAY['object.get_authenticated','object.get_authenticated_info'])
    OR public.course_pilot_admin() OR owner_id=auth.uid()::text));
ALTER POLICY "Avatar View Policy" ON storage.objects
  USING(bucket_id='avatars' AND (
    storage.allow_any_operation(ARRAY['object.get_authenticated','object.get_authenticated_info'])
    OR public.course_pilot_admin() OR owner_id=auth.uid()::text));
ALTER POLICY "Class files are publicly readable" ON storage.objects
  USING(bucket_id='class-files' AND (
    storage.allow_any_operation(ARRAY['object.get_authenticated','object.get_authenticated_info'])
    OR public.course_pilot_admin() OR owner_id=auth.uid()::text));
-- The older private-folder alias must not re-enable listing of other avatars.
ALTER POLICY "Enable upload access for authenticated users 1oj01fe_1" ON storage.objects
  USING(bucket_id='avatars' AND (storage.foldername(name))[1]='private'
    AND auth.role()='authenticated' AND (owner_id=auth.uid()::text OR public.course_pilot_admin()));

COMMIT;
NOTIFY pgrst,'reload schema';
