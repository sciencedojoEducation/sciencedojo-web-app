-- 058: Reliable Academy V2 drafts, snapshots, stable lesson progress, and assets.

ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  ADD COLUMN IF NOT EXISTS draft_revision BIGINT NOT NULL DEFAULT 1 CHECK (draft_revision > 0),
  ADD COLUMN IF NOT EXISTS autosaved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assessment_fingerprint TEXT;

ALTER TABLE public.academy_course_versions
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  ADD COLUMN IF NOT EXISTS assessment_fingerprint TEXT;

ALTER TABLE public.tutor_academy_progress
  ADD COLUMN IF NOT EXISTS started_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_lesson_id TEXT,
  ADD COLUMN IF NOT EXISTS completed_block_ids TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.tutor_academy_progress
SET started_lesson_ids = ARRAY(
      SELECT 'legacy:' || course_key || ':' || slug
      FROM unnest(started_lessons) AS item(slug)
    ),
    completed_lesson_ids = ARRAY(
      SELECT 'legacy:' || course_key || ':' || slug
      FROM unnest(completed_lessons) AS item(slug)
    ),
    current_lesson_id = CASE
      WHEN current_lesson IS NULL THEN NULL
      ELSE 'legacy:' || course_key || ':' || current_lesson
    END
WHERE cardinality(started_lesson_ids) = 0
  AND cardinality(completed_lesson_ids) = 0;

CREATE TABLE IF NOT EXISTS public.academy_course_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  draft_revision BIGINT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 2,
  reason TEXT NOT NULL CHECK (reason IN ('autosave', 'manual', 'publish', 'restore', 'migration')),
  content JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS academy_course_snapshots_course_idx
  ON public.academy_course_snapshots(course_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.academy_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'document')),
  mime_type TEXT NOT NULL,
  original_name TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0),
  alt_text TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.academy_course_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_assets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_is_academy_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admins manage academy snapshots" ON public.academy_course_snapshots;
CREATE POLICY "Admins manage academy snapshots" ON public.academy_course_snapshots
  FOR ALL USING (public.current_user_is_academy_admin())
  WITH CHECK (public.current_user_is_academy_admin());

DROP POLICY IF EXISTS "Admins manage academy assets" ON public.academy_assets;
CREATE POLICY "Admins manage academy assets" ON public.academy_assets
  FOR ALL USING (public.current_user_is_academy_admin())
  WITH CHECK (public.current_user_is_academy_admin());

CREATE OR REPLACE FUNCTION public.save_academy_course_draft_v2(
  target_course_id UUID,
  expected_revision BIGINT,
  next_content JSONB,
  next_title TEXT,
  next_audiences TEXT[],
  save_reason TEXT DEFAULT 'autosave'
)
RETURNS TABLE(revision BIGINT, saved_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  course_row public.academy_courses%ROWTYPE;
  next_revision BIGINT;
  now_value TIMESTAMPTZ := NOW();
BEGIN
  IF NOT public.current_user_is_academy_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF save_reason NOT IN ('autosave', 'manual', 'restore', 'migration') THEN RAISE EXCEPTION 'Invalid save reason'; END IF;

  SELECT * INTO course_row FROM public.academy_courses WHERE id = target_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found'; END IF;
  IF course_row.draft_revision <> expected_revision THEN
    RAISE EXCEPTION 'ACADEMY_REVISION_CONFLICT:%', course_row.draft_revision;
  END IF;

  next_revision := course_row.draft_revision + 1;
  UPDATE public.academy_courses
  SET draft_content = next_content,
      title = next_title,
      audience_roles = next_audiences,
      schema_version = COALESCE((next_content ->> 'schemaVersion')::INTEGER, 2),
      draft_revision = next_revision,
      autosaved_at = now_value,
      updated_at = now_value,
      updated_by = auth.uid()
  WHERE id = target_course_id;

  IF save_reason <> 'autosave' OR next_revision % 20 = 0 THEN
    INSERT INTO public.academy_course_snapshots(course_id, draft_revision, schema_version, reason, content, created_by)
    VALUES (target_course_id, next_revision, COALESCE((next_content ->> 'schemaVersion')::INTEGER, 2), save_reason, next_content, auth.uid());
  END IF;

  RETURN QUERY SELECT next_revision, now_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_academy_course_v2(
  target_course_id UUID,
  expected_revision BIGINT,
  next_assessment_fingerprint TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  course_row public.academy_courses%ROWTYPE;
  next_version INTEGER;
  next_quiz_revision INTEGER;
  created_version_id UUID;
  assessment_changed BOOLEAN;
  published_lesson_ids TEXT[] := ARRAY[]::TEXT[];
  next_lesson_ids TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT public.current_user_is_academy_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO course_row FROM public.academy_courses WHERE id = target_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found'; END IF;
  IF course_row.draft_revision <> expected_revision THEN
    RAISE EXCEPTION 'ACADEMY_REVISION_CONFLICT:%', course_row.draft_revision;
  END IF;

  assessment_changed := course_row.published_version_id IS NOT NULL
    AND course_row.assessment_fingerprint IS DISTINCT FROM next_assessment_fingerprint;
  next_quiz_revision := CASE WHEN assessment_changed THEN course_row.quiz_revision + 1 ELSE course_row.quiz_revision END;

  IF course_row.published_version_id IS NOT NULL THEN
    SELECT COALESCE(array_agg(item ->> 'id'), ARRAY[]::TEXT[]) INTO published_lesson_ids
    FROM public.academy_course_versions version,
         jsonb_array_elements(COALESCE(version.content -> 'lessons', '[]'::JSONB)) item
    WHERE version.id = course_row.published_version_id;
  END IF;
  SELECT COALESCE(array_agg(item ->> 'id'), ARRAY[]::TEXT[]) INTO next_lesson_ids
  FROM jsonb_array_elements(COALESCE(course_row.draft_content -> 'lessons', '[]'::JSONB)) item;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.academy_course_versions WHERE course_id = target_course_id;

  INSERT INTO public.academy_course_snapshots(course_id, draft_revision, schema_version, reason, content, created_by)
  VALUES (target_course_id, course_row.draft_revision, course_row.schema_version, 'publish', course_row.draft_content, auth.uid());

  INSERT INTO public.academy_course_versions(
    course_id, version_number, quiz_revision, schema_version, assessment_fingerprint, content, published_by
  ) VALUES (
    target_course_id, next_version, next_quiz_revision, course_row.schema_version,
    next_assessment_fingerprint,
    jsonb_set(course_row.draft_content, '{quizRevision}', to_jsonb(next_quiz_revision), TRUE), auth.uid()
  ) RETURNING id INTO created_version_id;

  UPDATE public.academy_courses
  SET published_version_id = created_version_id,
      quiz_revision = next_quiz_revision,
      assessment_fingerprint = next_assessment_fingerprint,
      status = 'published', published_at = NOW(), archived_at = NULL,
      updated_by = auth.uid(), updated_at = NOW()
  WHERE id = target_course_id;

  IF assessment_changed THEN
    UPDATE public.tutor_academy_progress
    SET completed_at = NULL, quiz_attempts = 0, best_score = 0, updated_at = NOW()
    WHERE course_key = course_row.course_key;
  ELSIF course_row.published_version_id IS NOT NULL AND NOT (next_lesson_ids <@ published_lesson_ids) THEN
    UPDATE public.tutor_academy_progress
    SET completed_at = NULL, updated_at = NOW()
    WHERE course_key = course_row.course_key;
  END IF;

  RETURN created_version_id;
END;
$$;

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-media', 'academy-media', TRUE, 20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

NOTIFY pgrst, 'reload schema';
