-- Mentor profile slugs and acquisition attribution for tutor-powered growth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.tutors
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE OR REPLACE FUNCTION public.sciencedojo_slugify(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := lower(coalesce(input_text, 'mentor'));
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
  normalized := regexp_replace(normalized, '(^-|-$)', '', 'g');
  IF normalized = '' THEN
    normalized := 'mentor';
  END IF;
  RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

WITH candidate_slugs AS (
  SELECT
    t.id,
    public.sciencedojo_slugify(p.full_name) AS base_slug
  FROM public.tutors t
  LEFT JOIN public.profiles p ON p.id = t.id
  WHERE t.slug IS NULL OR btrim(t.slug) = ''
),
ranked_slugs AS (
  SELECT
    id,
    base_slug,
    row_number() OVER (PARTITION BY base_slug ORDER BY id::text) AS slug_rank
  FROM candidate_slugs
)
UPDATE public.tutors t
SET slug = CASE
  WHEN ranked_slugs.slug_rank = 1
    AND NOT EXISTS (
      SELECT 1 FROM public.tutors existing
      WHERE existing.slug = ranked_slugs.base_slug
        AND existing.id <> ranked_slugs.id
    )
    THEN ranked_slugs.base_slug
  ELSE ranked_slugs.base_slug || '-' || left(ranked_slugs.id::text, 8)
END
FROM ranked_slugs
WHERE ranked_slugs.id = t.id;

CREATE UNIQUE INDEX IF NOT EXISTS tutors_slug_unique_idx
  ON public.tutors (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS tutors_slug_lookup_idx
  ON public.tutors (lower(slug));

CREATE OR REPLACE FUNCTION public.set_tutor_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INTEGER := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '' THEN
    NEW.slug := public.sciencedojo_slugify(NEW.slug);
    RETURN NEW;
  END IF;

  SELECT public.sciencedojo_slugify(full_name)
  INTO base_slug
  FROM public.profiles
  WHERE id = NEW.id;

  candidate_slug := coalesce(base_slug, 'mentor');

  WHILE EXISTS (
    SELECT 1 FROM public.tutors
    WHERE slug = candidate_slug
      AND id <> NEW.id
  ) LOOP
    suffix := suffix + 1;
    candidate_slug := coalesce(base_slug, 'mentor') || '-' || suffix::text;
  END LOOP;

  NEW.slug := candidate_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tutors_set_slug ON public.tutors;
CREATE TRIGGER tutors_set_slug
  BEFORE INSERT OR UPDATE OF slug ON public.tutors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tutor_slug();

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS acquisition_source TEXT,
  ADD COLUMN IF NOT EXISTS referrer_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS landing_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_source_id UUID;

ALTER TABLE public.assessment_leads
  ADD COLUMN IF NOT EXISTS acquisition_source TEXT,
  ADD COLUMN IF NOT EXISTS referrer_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS landing_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_source_id UUID;

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'mentor_profile',
  referrer_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  landing_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assessment_id UUID REFERENCES public.assessment_leads(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS lead_sources_session_idx ON public.lead_sources(session_id);
CREATE INDEX IF NOT EXISTS lead_sources_referrer_tutor_idx ON public.lead_sources(referrer_tutor_id);
CREATE INDEX IF NOT EXISTS lead_sources_landing_tutor_idx ON public.lead_sources(landing_tutor_id);
CREATE INDEX IF NOT EXISTS lead_sources_last_seen_idx ON public.lead_sources(last_seen_at DESC);

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_lead_source_id_fkey,
  ADD CONSTRAINT bookings_lead_source_id_fkey
    FOREIGN KEY (lead_source_id) REFERENCES public.lead_sources(id) ON DELETE SET NULL;

ALTER TABLE public.assessment_leads
  DROP CONSTRAINT IF EXISTS assessment_leads_lead_source_id_fkey,
  ADD CONSTRAINT assessment_leads_lead_source_id_fkey
    FOREIGN KEY (lead_source_id) REFERENCES public.lead_sources(id) ON DELETE SET NULL;

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view lead sources" ON public.lead_sources;
CREATE POLICY "Admins can view lead sources" ON public.lead_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update lead sources" ON public.lead_sources;
CREATE POLICY "Admins can update lead sources" ON public.lead_sources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public lead-source writes are handled server-side through the service role.
