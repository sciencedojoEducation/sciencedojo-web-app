-- Add moderation workflow fields for tutor reviews.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.reviews
SET status = 'approved'
WHERE status IS NULL;

ALTER TABLE public.reviews
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_status_check'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to approved reviews"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Allow authenticated users to insert reviews for their bookings" ON public.reviews;
CREATE POLICY "Allow authenticated users to insert pending reviews for their bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND status = 'pending'
    AND admin_note IS NULL
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
  );

CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
DECLARE
  affected_tutor_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.tutor_id IS DISTINCT FROM NEW.tutor_id THEN
    UPDATE public.tutors
    SET
      rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM public.reviews
        WHERE tutor_id = OLD.tutor_id
          AND status = 'approved'
      ), 0),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE tutor_id = OLD.tutor_id
          AND status = 'approved'
      )
    WHERE id = OLD.tutor_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    affected_tutor_id := OLD.tutor_id;
  ELSE
    affected_tutor_id := NEW.tutor_id;
  END IF;

  UPDATE public.tutors
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews
      WHERE tutor_id = affected_tutor_id
        AND status = 'approved'
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE tutor_id = affected_tutor_id
        AND status = 'approved'
    )
  WHERE id = affected_tutor_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
