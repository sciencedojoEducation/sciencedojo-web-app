-- Each learner chooses one exam route after the shared A1 curriculum.
ALTER TABLE public.tutor_academy_progress
  ADD COLUMN IF NOT EXISTS selected_exam_track TEXT;
