-- Phase 11: Tutor Directory Security Overhaul 🛡️👨‍🏫
-- This script ensures the Admin role has "God Mode" access to the tutors table.

-- 1. Ensure SELECT bypass for management
DROP POLICY IF EXISTS "Admins can view all tutors" ON public.tutors;
CREATE POLICY "Admins can view all tutors" ON public.tutors
  FOR SELECT TO authenticated
  USING (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text
  );

-- 2. Ensure UPDATE bypass for verification toggle
DROP POLICY IF EXISTS "Admins can update all tutors" ON public.tutors;
CREATE POLICY "Admins can update all tutors" ON public.tutors
  FOR UPDATE TO authenticated
  USING (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text
  );

-- 3. Double-check Profiles access (Admins need to see user details)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text
  );

DO $$ 
BEGIN
  RAISE NOTICE 'Tutor Directory Security Fixes Applied! 🛡️⚓';
END $$;
