-- 055: Tutor Academy progress and launch flag.

CREATE TABLE IF NOT EXISTS public.tutor_academy_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_key TEXT NOT NULL,
  completed_lessons TEXT[] NOT NULL DEFAULT '{}',
  current_lesson TEXT,
  quiz_attempts INTEGER NOT NULL DEFAULT 0 CHECK (quiz_attempts >= 0),
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_key)
);

CREATE INDEX IF NOT EXISTS tutor_academy_progress_completion_idx
  ON public.tutor_academy_progress (course_key, completed_at);

ALTER TABLE public.tutor_academy_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can read their academy progress" ON public.tutor_academy_progress;
CREATE POLICY "Tutors can read their academy progress" ON public.tutor_academy_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tutors can create their academy progress" ON public.tutor_academy_progress;
CREATE POLICY "Tutors can create their academy progress" ON public.tutor_academy_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tutors can update their academy progress" ON public.tutor_academy_progress;
CREATE POLICY "Tutors can update their academy progress" ON public.tutor_academy_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read academy progress" ON public.tutor_academy_progress;
CREATE POLICY "Admins can read academy progress" ON public.tutor_academy_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

INSERT INTO public.feature_flags (key, label, description, enabled, category)
VALUES (
  'tutor_academy_enabled',
  'Tutor Academy',
  'Show the optional Tutor Academy induction course to tutor applicants.',
  TRUE,
  'Dashboards'
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category;
