-- Create the function to calculate and update tutor ratings
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
DECLARE
  affected_tutor_id uuid;
BEGIN
  -- If a review is moved between tutors, recalculate the old tutor first.
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

  -- Public tutor ratings only include admin-approved reviews.
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

-- Create the trigger that runs after a review is inserted or updated
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_tutor_rating();

-- Add review_count column to tutors table if it doesn't exist yet
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tutors' AND column_name='review_count') THEN
        ALTER TABLE public.tutors ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
END $$;
