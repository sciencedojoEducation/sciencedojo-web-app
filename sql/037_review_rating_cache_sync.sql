-- Keep cached public tutor ratings synchronized with approved reviews.
-- This migration is intentionally forward-only so production databases that
-- already ran earlier review migrations get the repaired trigger/function.

-- Some production databases may not have received the moderation columns yet.
-- Ensure the rating repair can run safely even if this migration is applied
-- before/without 036_moderated_reviews.sql.
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

CREATE OR REPLACE FUNCTION public.recalculate_tutor_rating(target_tutor_id uuid)
RETURNS void AS $$
BEGIN
  IF target_tutor_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.tutors
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(reviews.rating)::numeric, 1)
      FROM public.reviews
      WHERE reviews.tutor_id = target_tutor_id
        AND reviews.status = 'approved'
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*)::integer
      FROM public.reviews
      WHERE reviews.tutor_id = target_tutor_id
        AND reviews.status = 'approved'
    ), 0)
  WHERE id = target_tutor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_tutor_rating(OLD.tutor_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.tutor_id IS DISTINCT FROM NEW.tutor_id THEN
    PERFORM public.recalculate_tutor_rating(OLD.tutor_id);
  END IF;

  PERFORM public.recalculate_tutor_rating(NEW.tutor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_tutor_rating();

-- Backfill every tutor cache once so stale counts from previous trigger
-- definitions are corrected immediately after this migration is applied.
DO $$
DECLARE
  tutor_record record;
BEGIN
  FOR tutor_record IN SELECT id FROM public.tutors LOOP
    PERFORM public.recalculate_tutor_rating(tutor_record.id);
  END LOOP;
END $$;
