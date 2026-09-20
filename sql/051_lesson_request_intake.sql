-- Structured lesson-request intake, reusable learners, and private supporting materials.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.curriculum_specifications (
  id TEXT PRIMARY KEY,
  curriculum_key TEXT NOT NULL,
  version_label TEXT NOT NULL,
  source_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.curriculum_specifications
  ADD COLUMN IF NOT EXISTS pathway_key TEXT,
  ADD COLUMN IF NOT EXISTS stage_key TEXT,
  ADD COLUMN IF NOT EXISTS awarding_body_key TEXT,
  ADD COLUMN IF NOT EXISTS subject_key TEXT,
  ADD COLUMN IF NOT EXISTS subject_variant_key TEXT,
  ADD COLUMN IF NOT EXISTS specification_code TEXT,
  ADD COLUMN IF NOT EXISTS effective_from DATE,
  ADD COLUMN IF NOT EXISTS effective_to DATE;

INSERT INTO public.curriculum_specifications (id, curriculum_key, version_label)
VALUES
  ('uk-national-curriculum@taxonomy-v1', 'UK National Curriculum', 'ScienceDojo taxonomy v1'),
  ('cambridge-primary@taxonomy-v1', 'Cambridge Primary', 'ScienceDojo taxonomy v1'),
  ('cambridge-lower-secondary@taxonomy-v1', 'Cambridge Lower Secondary', 'ScienceDojo taxonomy v1'),
  ('edexcel-gcse@taxonomy-v1', 'Edexcel GCSE', 'ScienceDojo taxonomy v1'),
  ('aqa-gcse@taxonomy-v1', 'AQA GCSE', 'ScienceDojo taxonomy v1'),
  ('cambridge-igcse@taxonomy-v1', 'Cambridge IGCSE', 'ScienceDojo taxonomy v1'),
  ('sqa-national-5@taxonomy-v1', 'SQA National 5', 'ScienceDojo taxonomy v1'),
  ('edexcel-a-level@taxonomy-v1', 'Edexcel A-Level', 'ScienceDojo taxonomy v1'),
  ('aqa-a-level@taxonomy-v1', 'AQA A-Level', 'ScienceDojo taxonomy v1'),
  ('cambridge-international-a-level@taxonomy-v1', 'Cambridge International A-Level', 'ScienceDojo taxonomy v1'),
  ('ib-diploma-programme@taxonomy-v1', 'IB Diploma Programme', 'ScienceDojo taxonomy v1'),
  ('sqa-higher@taxonomy-v1', 'SQA Higher', 'ScienceDojo taxonomy v1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.curriculum_specifications (id, curriculum_key, pathway_key, version_label)
VALUES
  ('england.taxonomy-2026', 'england', 'england', 'Curriculum taxonomy 2026'),
  ('wales.taxonomy-2026', 'wales', 'wales', 'Curriculum taxonomy 2026'),
  ('northern_ireland.taxonomy-2026', 'northern_ireland', 'northern_ireland', 'Curriculum taxonomy 2026'),
  ('scotland.taxonomy-2026', 'scotland', 'scotland', 'Curriculum taxonomy 2026'),
  ('cambridge_international.taxonomy-2026', 'cambridge_international', 'cambridge_international', 'Curriculum taxonomy 2026'),
  ('pearson_international.taxonomy-2026', 'pearson_international', 'pearson_international', 'Curriculum taxonomy 2026'),
  ('ib.taxonomy-2026', 'ib', 'ib', 'Curriculum taxonomy 2026')
ON CONFLICT (id) DO NOTHING;

UPDATE public.curriculum_specifications AS specification
SET source_url = sources.source_url
FROM (VALUES
  ('england.taxonomy-2026', 'https://www.gov.uk/national-curriculum'),
  ('wales.taxonomy-2026', 'https://hwb.gov.wales/curriculum-for-wales'),
  ('northern_ireland.taxonomy-2026', 'https://www.education-ni.gov.uk/articles/statutory-curriculum'),
  ('scotland.taxonomy-2026', 'https://qualifications.gov.scot/'),
  ('cambridge_international.taxonomy-2026', 'https://www.cambridgeinternational.org/programmes-and-qualifications/'),
  ('pearson_international.taxonomy-2026', 'https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses.html'),
  ('ib.taxonomy-2026', 'https://ibo.org/programmes/')
) AS sources(id, source_url)
WHERE specification.id = sources.id;

ALTER TABLE public.curriculum_specifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Curriculum specifications are readable" ON public.curriculum_specifications;
CREATE POLICY "Curriculum specifications are readable" ON public.curriculum_specifications
  FOR SELECT USING (TRUE);

CREATE TABLE IF NOT EXISTS public.learner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  school_year TEXT NOT NULL,
  stage TEXT NOT NULL,
  curriculum_key TEXT,
  curriculum_version_id TEXT REFERENCES public.curriculum_specifications(id) ON DELETE SET NULL,
  level TEXT,
  support_preferences TEXT[] NOT NULL DEFAULT '{}',
  accommodations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS learner_profiles_owner_idx ON public.learner_profiles(owner_id);
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage learner profiles" ON public.learner_profiles;
CREATE POLICY "Owners manage learner profiles" ON public.learner_profiles
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins view learner profiles" ON public.learner_profiles;
CREATE POLICY "Admins view learner profiles" ON public.learner_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS learner_id UUID REFERENCES public.learner_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS learning_context JSONB;

ALTER TABLE public.assessment_leads
  ADD COLUMN IF NOT EXISTS learning_context JSONB;

CREATE INDEX IF NOT EXISTS bookings_learner_idx ON public.bookings(learner_id);
CREATE INDEX IF NOT EXISTS bookings_intake_status_idx ON public.bookings((learning_context->>'intakeStatus'));

CREATE OR REPLACE FUNCTION public.prevent_booking_learning_context_rewrite()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.learning_context IS NOT NULL
     AND NEW.learning_context IS DISTINCT FROM OLD.learning_context THEN
    RAISE EXCEPTION 'Booking learning context is an immutable request snapshot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_learning_context_immutable ON public.bookings;
CREATE TRIGGER bookings_learning_context_immutable
  BEFORE UPDATE OF learning_context ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_learning_context_rewrite();

CREATE OR REPLACE FUNCTION public.prevent_assessment_learning_context_rewrite()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.learning_context IS NOT NULL
     AND NEW.learning_context IS DISTINCT FROM OLD.learning_context THEN
    RAISE EXCEPTION 'Assessment learning context is an immutable intake snapshot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assessment_learning_context_immutable ON public.assessment_leads;
CREATE TRIGGER assessment_learning_context_immutable
  BEFORE UPDATE OF learning_context ON public.assessment_leads
  FOR EACH ROW EXECUTE FUNCTION public.prevent_assessment_learning_context_rewrite();

CREATE TABLE IF NOT EXISTS public.lesson_request_materials (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.learner_profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_request_materials_booking_idx ON public.lesson_request_materials(booking_id);
ALTER TABLE public.lesson_request_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking participants view lesson materials" ON public.lesson_request_materials;
CREATE POLICY "Booking participants view lesson materials" ON public.lesson_request_materials
  FOR SELECT USING (
    owner_id = auth.uid()
    OR tutor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Requesters create lesson materials" ON public.lesson_request_materials;
CREATE POLICY "Requesters create lesson materials" ON public.lesson_request_materials
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Requesters delete lesson materials" ON public.lesson_request_materials;
CREATE POLICY "Requesters delete lesson materials" ON public.lesson_request_materials
  FOR DELETE USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-request-materials',
  'lesson-request-materials',
  FALSE,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Requesters upload lesson materials" ON storage.objects;
CREATE POLICY "Requesters upload lesson materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lesson-request-materials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Booking participants download lesson materials" ON storage.objects;
CREATE POLICY "Booking participants download lesson materials" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lesson-request-materials'
    AND EXISTS (
      SELECT 1 FROM public.lesson_request_materials material
      WHERE material.storage_path = storage.objects.name
        AND (
          material.owner_id = auth.uid()
          OR material.tutor_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Requesters delete lesson material objects" ON storage.objects;
CREATE POLICY "Requesters delete lesson material objects" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lesson-request-materials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
