-- Phase 9: Admin Forge - RLS Overrides 🛡️
-- This script grants the 'admin' role full bypass permissions for management and oversight.

-- 1. Profiles Table Overrides
-- Allow admins to update any profile (useful for manual role correction or banning)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 2. Tutors Table Overrides
-- Allow admins to update tutor details (verification status, etc.)
DROP POLICY IF EXISTS "Admins can update all tutors" ON public.tutors;
CREATE POLICY "Admins can update all tutors" ON public.tutors
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 3. Bookings Table Overrides
-- Allow admins to view all bookings for platform audits
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to update booking status for dispute resolution
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
CREATE POLICY "Admins can update all bookings" ON public.bookings
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to view all messages (necessary for Safeguards review)
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to update messages (necessary for dismiss/warning actions)
DROP POLICY IF EXISTS "Admins can update all messages" ON public.messages;
CREATE POLICY "Admins can update all messages" ON public.messages
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to insert messages (necessary for system warning notifications)
DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
CREATE POLICY "Admins can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to view all conversations (necessary for Safeguards review)
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations" ON public.conversations
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DO $$ 
BEGIN
  RAISE NOTICE 'Admin RLS Overrides Applied! 🚀🛡️';
END $$;

-- Allow admins to have full access to announcements (override metadata checks)
DROP POLICY IF EXISTS "Admins have full access to announcements" ON public.announcements;
CREATE POLICY "Admins have full access to announcements" ON public.announcements
  FOR ALL TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
