-- 047: Separate tutor public listing approval from full verification.

ALTER TABLE public.tutors
  ADD COLUMN IF NOT EXISTS tutor_status TEXT NOT NULL DEFAULT 'application_submitted',
  ADD COLUMN IF NOT EXISTS is_publicly_listed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS background_check_type TEXT,
  ADD COLUMN IF NOT EXISTS background_check_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.tutors
  DROP CONSTRAINT IF EXISTS tutors_tutor_status_check;

ALTER TABLE public.tutors
  ADD CONSTRAINT tutors_tutor_status_check
  CHECK (tutor_status IN (
    'application_submitted',
    'under_review',
    'approved_listed',
    'verified',
    'featured',
    'rejected',
    'suspended'
  ));

ALTER TABLE public.tutors
  DROP CONSTRAINT IF EXISTS tutors_background_check_type_check;

ALTER TABLE public.tutors
  ADD CONSTRAINT tutors_background_check_type_check
  CHECK (background_check_type IS NULL OR background_check_type IN ('dbs', 'police_clearance', 'not_required'));

ALTER TABLE public.tutors
  DROP CONSTRAINT IF EXISTS tutors_background_check_status_check;

ALTER TABLE public.tutors
  ADD CONSTRAINT tutors_background_check_status_check
  CHECK (background_check_status IN ('not_started', 'submitted', 'approved', 'rejected'));

UPDATE public.tutors
SET
  tutor_status = CASE
    WHEN is_verified = TRUE THEN 'verified'
    ELSE tutor_status
  END,
  is_publicly_listed = CASE
    WHEN is_verified = TRUE THEN TRUE
    ELSE is_publicly_listed
  END,
  verified_at = CASE
    WHEN is_verified = TRUE AND verified_at IS NULL THEN created_at
    ELSE verified_at
  END
WHERE is_verified = TRUE;

UPDATE public.tutors t
SET tutor_status = 'under_review'
FROM public.applications a
WHERE t.id = a.user_id
  AND COALESCE(t.is_verified, FALSE) = FALSE
  AND COALESCE(t.is_publicly_listed, FALSE) = FALSE
  AND a.status = 'pending';

UPDATE public.tutors t
SET
  tutor_status = 'approved_listed',
  is_publicly_listed = TRUE,
  approved_at = COALESCE(t.approved_at, a.updated_at, a.created_at)
FROM public.applications a
WHERE t.id = a.user_id
  AND COALESCE(t.is_verified, FALSE) = FALSE
  AND a.status = 'approved';

CREATE INDEX IF NOT EXISTS tutors_public_listing_idx
  ON public.tutors (is_publicly_listed, tutor_status);

CREATE INDEX IF NOT EXISTS tutors_verification_status_idx
  ON public.tutors (is_verified, is_featured, background_check_status);
