-- Resume positions are private navigation bookmarks, never completion records.
CREATE TABLE IF NOT EXISTS public.academy_learner_positions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_key TEXT NOT NULL CHECK (char_length(course_key) BETWEEN 1 AND 200),
  lesson_id TEXT NOT NULL CHECK (char_length(lesson_id) BETWEEN 1 AND 200),
  block_id TEXT NOT NULL CHECK (char_length(block_id) BETWEEN 1 AND 200),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_key)
);
ALTER TABLE public.academy_learner_positions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_learner_positions TO authenticated;
DROP POLICY IF EXISTS "Learners manage own resume positions" ON public.academy_learner_positions;
CREATE POLICY "Learners manage own resume positions"
  ON public.academy_learner_positions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
