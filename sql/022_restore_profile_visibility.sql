-- RESTORE PROFILE VISIBILITY FOR TUTORS & MARKETPLACE (PHASE 12) 🛡️👤
-- Tutors need to see student names and avatars, and public needs to see tutors.

-- 1. Restore Profile SELECT access
-- Everyone (incl. public/anon) can see profiles of TUTORS
DROP POLICY IF EXISTS "Public can view tutor profiles" ON public.profiles;
CREATE POLICY "Public can view tutor profiles" ON public.profiles
  FOR SELECT USING (role = 'tutor');

-- Authenticated users (tutors/parents) can view basic info of ANY profile (for bookings/messaging)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view basic profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 2. Restore Tutor SELECT access for everyone (Marketplace)
DROP POLICY IF EXISTS "Tutors are viewable by everyone" ON public.tutors;
DROP POLICY IF EXISTS "Admins can view all tutors" ON public.tutors;
DROP POLICY IF EXISTS "Public can view tutors" ON public.tutors;

CREATE POLICY "Public can view tutors" ON public.tutors
  FOR SELECT USING (true);

-- 3. Confirm RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  RAISE NOTICE 'Profile & Tutor Visibility Restored (Marketplace Fixed)! 🟢👥';
END $$;
