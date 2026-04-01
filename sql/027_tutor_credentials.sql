-- 1. Add new columns to the tutors table for the deeper vetting process
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS experience_summary TEXT,
ADD COLUMN IF NOT EXISTS has_teaching_license BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- 2. Notify Success
DO $$ 
BEGIN
  RAISE NOTICE 'Tutor Credentials Schema Extension Applied Successfully! 🎓📜';
END $$;
