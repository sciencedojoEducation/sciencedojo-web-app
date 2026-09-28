-- 062: Native Academy audio plus private learner writing and speaking portfolios.

ALTER TABLE public.academy_assets
  DROP CONSTRAINT IF EXISTS academy_assets_media_type_check;
ALTER TABLE public.academy_assets
  ADD CONSTRAINT academy_assets_media_type_check
  CHECK (media_type IN ('image', 'document', 'audio'));

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-media', 'academy-media', TRUE, 20971520,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
    'audio/mpeg', 'audio/mp4', 'audio/x-m4a'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.academy_learner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_key TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('writing', 'speaking')),
  text_response TEXT CHECK (char_length(text_response) <= 5000),
  audio_path TEXT,
  audio_duration_seconds INTEGER CHECK (
    audio_duration_seconds IS NULL OR audio_duration_seconds BETWEEN 1 AND 180
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_key, lesson_id, block_id),
  CHECK (
    (submission_type = 'writing' AND text_response IS NOT NULL AND audio_path IS NULL)
    OR (submission_type = 'speaking' AND text_response IS NULL AND audio_path IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS academy_learner_submissions_user_course_idx
  ON public.academy_learner_submissions(user_id, course_key, updated_at DESC);

ALTER TABLE public.academy_learner_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners read own academy submissions" ON public.academy_learner_submissions;
CREATE POLICY "Learners read own academy submissions"
  ON public.academy_learner_submissions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners create own academy submissions" ON public.academy_learner_submissions;
CREATE POLICY "Learners create own academy submissions"
  ON public.academy_learner_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners update own academy submissions" ON public.academy_learner_submissions;
CREATE POLICY "Learners update own academy submissions"
  ON public.academy_learner_submissions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners delete own academy submissions" ON public.academy_learner_submissions;
CREATE POLICY "Learners delete own academy submissions"
  ON public.academy_learner_submissions FOR DELETE
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-learner-audio', 'academy-learner-audio', FALSE, 10485760,
  ARRAY['audio/webm', 'audio/mp4', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Learners read own academy audio" ON storage.objects;
CREATE POLICY "Learners read own academy audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'academy-learner-audio'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Learners upload own academy audio" ON storage.objects;
CREATE POLICY "Learners upload own academy audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'academy-learner-audio'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Learners update own academy audio" ON storage.objects;
CREATE POLICY "Learners update own academy audio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'academy-learner-audio'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Learners delete own academy audio" ON storage.objects;
CREATE POLICY "Learners delete own academy audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'academy-learner-audio'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

NOTIFY pgrst, 'reload schema';
