-- Create the function to calculate and update tutor ratings
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- We update the tutor record with the new average rating and review count
  -- We calculate the average from all reviews for this tutor
  UPDATE public.tutors
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE tutor_id = NEW.tutor_id
    ),
    review_count = (
      SELECT COUNT(*) FROM public.reviews WHERE tutor_id = NEW.tutor_id
    )
  WHERE id = NEW.tutor_id;
  
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
