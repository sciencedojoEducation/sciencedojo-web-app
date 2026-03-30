-- Phase 11.3: Tutor Database Record Sync 🔄👨‍🏫
-- This script repairs the "Missing Record" issue where a Profile exists with role='tutor' but no entry exists in the tutors table.

-- 1. Create missing tutor records
-- We use placeholder values that the tutor can later update in their dashboard.
INSERT INTO public.tutors (id, is_verified, hourly_rate, subjects, rating)
SELECT p.id, false, 30, '{General}', 0
FROM public.profiles p
WHERE p.role = 'tutor'
  AND NOT EXISTS (
    SELECT 1 FROM public.tutors t WHERE t.id = p.id
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure RLS policies don't block the Admin during this sync
-- This already handled in 020_tutors_rls_fix.sql, but good for safety.

DO $$ 
DECLARE
    v_count INT;
BEGIN
    SELECT count(*) INTO v_count FROM public.tutors;
    RAISE NOTICE 'Sync Complete! Total Tutor records now: % 🔗✅', v_count;
END $$;
