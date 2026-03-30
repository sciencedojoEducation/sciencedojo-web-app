-- 005: Tutor Availability System
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.tutor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,           -- e.g. '2026-04-01'
  start_time TIME NOT NULL,     -- e.g. '09:00'
  end_time   TIME NOT NULL,     -- e.g. '12:00'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Prevent overlapping start times on the same day for the same tutor
  CONSTRAINT tutor_availability_unique_slot UNIQUE (tutor_id, date, start_time)
);

ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read (students need to query which days/slots are available)
DROP POLICY IF EXISTS "Public can read availability" ON public.tutor_availability;
CREATE POLICY "Public can read availability" ON public.tutor_availability
  FOR SELECT USING (true);

-- Only the owning tutor can insert / update / delete their own slots
DROP POLICY IF EXISTS "Tutor manages own availability" ON public.tutor_availability;
CREATE POLICY "Tutor manages own availability" ON public.tutor_availability
  FOR ALL USING (auth.uid() = tutor_id);

-- Add duration_hours to bookings so students can book 1 or 2-hour sessions
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER NOT NULL DEFAULT 1;
