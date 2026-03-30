-- 008_lesson_notes.sql

CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  homework TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

-- Policies for Lesson Notes
-- 1. Support team/Admin can view all
CREATE POLICY "Admins can view all lesson notes" ON public.lesson_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Tutors can view and create notes for their own bookings
CREATE POLICY "Tutors can manage their own lesson notes" ON public.lesson_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = lesson_notes.booking_id AND tutor_id = auth.uid()
    )
  );

-- 3. Students and Parents can view notes for their own bookings
CREATE POLICY "Students and Parents can view their lesson notes" ON public.lesson_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = lesson_notes.booking_id AND student_id = auth.uid()
    )
  );
