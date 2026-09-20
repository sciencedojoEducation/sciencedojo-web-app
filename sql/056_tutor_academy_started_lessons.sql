-- 056: Persist every Academy lesson a tutor has opened.

ALTER TABLE public.tutor_academy_progress
  ADD COLUMN IF NOT EXISTS started_lessons TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.tutor_academy_progress
SET started_lessons = ARRAY(
  SELECT DISTINCT lesson_slug
  FROM unnest(
    completed_lessons ||
    CASE
      WHEN current_lesson IS NULL THEN ARRAY[]::TEXT[]
      ELSE ARRAY[current_lesson]
    END
  ) AS started(lesson_slug)
)
WHERE cardinality(started_lessons) = 0
  AND (cardinality(completed_lessons) > 0 OR current_lesson IS NOT NULL);
