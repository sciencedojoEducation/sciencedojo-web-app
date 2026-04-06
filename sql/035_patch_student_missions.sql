-- 035_patch_student_missions.sql

ALTER TABLE public.student_missions ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);
