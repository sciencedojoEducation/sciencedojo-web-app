-- Secure admin authorization: stop trusting user-editable sources in RLS.
--
-- Problem:
--   * Many policies used (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'.
--     user_metadata is editable by end users, so this is bypassable.
--   * profiles.role was itself self-editable to 'admin' (the "Users can update
--     own profile" policy only blocked 'internal'), so switching to profiles.role
--     alone would not be safe.
--
-- Fix:
--   1. Lock down profiles.role so users cannot self-assign 'admin'/'internal'.
--   2. Authorize admins via public.is_admin_profile() (SECURITY DEFINER — reads
--      the now-trusted profiles.role and avoids RLS recursion).

-- Ensure the trusted helper exists (originally from sql/040).
CREATE OR REPLACE FUNCTION public.is_admin_profile()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 1. Prevent privilege escalation through profiles.role.
--    Authenticated non-admins may still self-assign base roles (e.g. 'tutor'
--    during onboarding), but never 'admin' or 'internal'. Trusted contexts
--    (service role, SQL editor) have no auth.uid() and are allowed through.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW; -- role unchanged
  END IF;
  IF auth.uid() IS NULL OR public.is_admin_profile() THEN
    RETURN NEW; -- trusted backend / SQL editor / verified admin
  END IF;
  IF NEW.role IN ('admin', 'internal') THEN
    RAISE EXCEPTION 'Not authorized to change role to %', NEW.role;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_protect_role ON public.profiles;
CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 2. Replace insecure user_metadata checks with is_admin_profile().

-- Bookings (includes the Supabase-linted "Admin Global Select" policy).
DROP POLICY IF EXISTS "Admin Global Select" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (public.is_admin_profile());
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
CREATE POLICY "Admins can update all bookings" ON public.bookings
  FOR UPDATE USING (public.is_admin_profile());

-- Profiles (SECURITY DEFINER helper => no recursion).
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_profile());
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin_profile());

-- Tutors.
DROP POLICY IF EXISTS "Admins can view all tutors" ON public.tutors;
CREATE POLICY "Admins can view all tutors" ON public.tutors
  FOR SELECT USING (public.is_admin_profile());
DROP POLICY IF EXISTS "Admins can update all tutors" ON public.tutors;
CREATE POLICY "Admins can update all tutors" ON public.tutors
  FOR UPDATE USING (public.is_admin_profile());

DO $$ BEGIN RAISE NOTICE 'Secure admin RLS applied. Remaining user_metadata policies: 023, 039, 041, 042.'; END $$;
