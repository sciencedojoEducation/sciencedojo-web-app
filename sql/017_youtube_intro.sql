-- Phase 7: Add YouTube Intro URL for Tutors

-- 1. Add youtube_intro_url to tutors table
ALTER TABLE tutors ADD COLUMN youtube_intro_url TEXT;

-- 2. Update RLS policies (if necessary, though naturally covered by existing policies)
-- The profiles and tutors tables already have broad read access.

-- 3. Add an index for possible future lookups or filtering (optional)
CREATE INDEX idx_tutors_youtube_url ON tutors(youtube_intro_url) WHERE youtube_intro_url IS NOT NULL;

-- 4. Enable auditing/tracking for the column if needed
-- COMMENT ON COLUMN tutors.youtube_intro_url IS 'The identifier or full URL for a YouTube Introduction video of the tutor.';
