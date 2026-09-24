-- Named recovery points for Academy drafts. Existing snapshots remain valid.
ALTER TABLE public.academy_course_snapshots
  ADD COLUMN IF NOT EXISTS label TEXT;

ALTER TABLE public.academy_course_snapshots
  DROP CONSTRAINT IF EXISTS academy_course_snapshots_label_length;
ALTER TABLE public.academy_course_snapshots
  ADD CONSTRAINT academy_course_snapshots_label_length
  CHECK (label IS NULL OR (char_length(trim(label)) BETWEEN 1 AND 120));

NOTIFY pgrst, 'reload schema';
