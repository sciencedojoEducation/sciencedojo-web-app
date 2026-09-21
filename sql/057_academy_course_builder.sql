-- 057: Database-backed Academy courses, immutable published versions, and media.

ALTER TABLE public.tutor_academy_progress
  ADD COLUMN IF NOT EXISTS started_lessons TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS passed_quiz_revision INTEGER NOT NULL DEFAULT 0 CHECK (passed_quiz_revision >= 0);

UPDATE public.tutor_academy_progress
SET passed_quiz_revision = 1
WHERE completed_at IS NOT NULL AND passed_quiz_revision = 0;

CREATE TABLE IF NOT EXISTS public.academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key TEXT NOT NULL UNIQUE CHECK (course_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  audience_roles TEXT[] NOT NULL DEFAULT '{}',
  draft_content JSONB NOT NULL,
  published_version_id UUID,
  quiz_revision INTEGER NOT NULL DEFAULT 1 CHECK (quiz_revision > 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.academy_course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  quiz_revision INTEGER NOT NULL CHECK (quiz_revision > 0),
  content JSONB NOT NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, version_number)
);

ALTER TABLE public.academy_courses
  DROP CONSTRAINT IF EXISTS academy_courses_published_version_id_fkey;
ALTER TABLE public.academy_courses
  ADD CONSTRAINT academy_courses_published_version_id_fkey
  FOREIGN KEY (published_version_id) REFERENCES public.academy_course_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS academy_courses_status_idx ON public.academy_courses(status);
CREATE INDEX IF NOT EXISTS academy_course_versions_course_idx ON public.academy_course_versions(course_id, version_number DESC);

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
  ) OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.current_user_matches_academy_audience(audiences TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_is_academy_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = ANY(audiences)
    )
    OR (
      'tutor_applicant' = ANY(audiences)
      AND EXISTS (SELECT 1 FROM public.applications a WHERE a.user_id = auth.uid())
    );
$$;

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_course_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage academy courses" ON public.academy_courses;
CREATE POLICY "Admins manage academy courses" ON public.academy_courses
  FOR ALL USING (public.current_user_is_academy_admin())
  WITH CHECK (public.current_user_is_academy_admin());

DROP POLICY IF EXISTS "Eligible users read published academy courses" ON public.academy_courses;
CREATE POLICY "Eligible users read published academy courses" ON public.academy_courses
  FOR SELECT USING (
    status = 'published'
    AND public.current_user_matches_academy_audience(audience_roles)
  );

DROP POLICY IF EXISTS "Admins manage academy versions" ON public.academy_course_versions;
CREATE POLICY "Admins manage academy versions" ON public.academy_course_versions
  FOR ALL USING (public.current_user_is_academy_admin())
  WITH CHECK (public.current_user_is_academy_admin());

DROP POLICY IF EXISTS "Eligible users read published academy versions" ON public.academy_course_versions;
CREATE POLICY "Eligible users read published academy versions" ON public.academy_course_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.academy_courses c
      WHERE c.id = course_id
        AND c.status = 'published'
        AND c.published_version_id = academy_course_versions.id
        AND public.current_user_matches_academy_audience(c.audience_roles)
    )
  );

CREATE OR REPLACE FUNCTION public.prevent_academy_version_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Published Academy versions are immutable';
END;
$$;

DROP TRIGGER IF EXISTS academy_versions_are_immutable ON public.academy_course_versions;
CREATE TRIGGER academy_versions_are_immutable
  BEFORE UPDATE OR DELETE ON public.academy_course_versions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_academy_version_changes();

CREATE OR REPLACE FUNCTION public.publish_academy_course(target_course_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  target_course public.academy_courses%ROWTYPE;
  previous_content JSONB;
  next_version INTEGER;
  next_quiz_revision INTEGER;
  created_version_id UUID;
  quiz_changed BOOLEAN := FALSE;
  previous_lesson_slugs TEXT[] := ARRAY[]::TEXT[];
  next_lesson_slugs TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT public.current_user_is_academy_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO target_course
  FROM public.academy_courses
  WHERE id = target_course_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found'; END IF;

  IF target_course.published_version_id IS NOT NULL THEN
    SELECT content INTO previous_content
    FROM public.academy_course_versions
    WHERE id = target_course.published_version_id;
  END IF;

  IF previous_content IS NOT NULL THEN
    SELECT COALESCE(array_agg(item ->> 'slug' ORDER BY item ->> 'slug'), ARRAY[]::TEXT[])
      INTO previous_lesson_slugs
    FROM jsonb_array_elements(COALESCE(previous_content -> 'lessons', '[]'::JSONB)) AS item;
  END IF;
  SELECT COALESCE(array_agg(item ->> 'slug' ORDER BY item ->> 'slug'), ARRAY[]::TEXT[])
    INTO next_lesson_slugs
  FROM jsonb_array_elements(COALESCE(target_course.draft_content -> 'lessons', '[]'::JSONB)) AS item;

  quiz_changed := previous_content IS NOT NULL AND (
    previous_content -> 'quiz' IS DISTINCT FROM target_course.draft_content -> 'quiz'
    OR previous_content -> 'passMark' IS DISTINCT FROM target_course.draft_content -> 'passMark'
  );

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.academy_course_versions
  WHERE course_id = target_course_id;

  next_quiz_revision := CASE
    WHEN previous_content IS NULL THEN 1
    WHEN quiz_changed THEN target_course.quiz_revision + 1
    ELSE target_course.quiz_revision
  END;

  INSERT INTO public.academy_course_versions (
    course_id, version_number, quiz_revision, content, published_by
  ) VALUES (
    target_course_id,
    next_version,
    next_quiz_revision,
    jsonb_set(target_course.draft_content, '{quizRevision}', to_jsonb(next_quiz_revision), TRUE),
    auth.uid()
  ) RETURNING id INTO created_version_id;

  UPDATE public.academy_courses
  SET published_version_id = created_version_id,
      quiz_revision = next_quiz_revision,
      status = 'published',
      published_at = NOW(),
      archived_at = NULL,
      updated_by = auth.uid(),
      updated_at = NOW()
  WHERE id = target_course_id;

  IF quiz_changed THEN
    UPDATE public.tutor_academy_progress
    SET completed_at = NULL,
        quiz_attempts = 0,
        best_score = 0,
        updated_at = NOW()
    WHERE course_key = target_course.course_key;
  ELSIF previous_content IS NOT NULL AND NOT (next_lesson_slugs <@ previous_lesson_slugs) THEN
    UPDATE public.tutor_academy_progress
    SET completed_at = NULL,
        updated_at = NOW()
    WHERE course_key = target_course.course_key;
  END IF;

  RETURN created_version_id;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-media',
  'academy-media',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Academy media is publicly readable" ON storage.objects;
CREATE POLICY "Academy media is publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'academy-media');

DROP POLICY IF EXISTS "Admins upload academy media" ON storage.objects;
CREATE POLICY "Admins upload academy media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'academy-media' AND public.current_user_is_academy_admin());

DROP POLICY IF EXISTS "Admins update academy media" ON storage.objects;
CREATE POLICY "Admins update academy media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'academy-media' AND public.current_user_is_academy_admin());

DROP POLICY IF EXISTS "Admins delete academy media" ON storage.objects;
CREATE POLICY "Admins delete academy media" ON storage.objects
  FOR DELETE USING (bucket_id = 'academy-media' AND public.current_user_is_academy_admin());

NOTIFY pgrst, 'reload schema';
