-- MIGRATION SCRIPT: Localize Tutor Rates to GBP
-- Target: Adjust USD-origin numeric rates to GBP-representative values

-- 1. Update Sarah Jenkins
UPDATE public.tutors SET hourly_rate = 65 WHERE id = '11111111-1111-1111-1111-111111111111';

-- 2. Update Michael Chen
UPDATE public.tutors SET hourly_rate = 55 WHERE id = '22222222-2222-2222-2222-222222222222';

-- 3. Update Elena Rodriguez
UPDATE public.tutors SET hourly_rate = 45 WHERE id = '33333333-3333-3333-3333-333333333333';

-- 4. Update James Wilson
UPDATE public.tutors SET hourly_rate = 50 WHERE id = '44444444-4444-4444-4444-444444444444';

-- 5. Update Ananya Patel
UPDATE public.tutors SET hourly_rate = 85 WHERE id = '55555555-5555-5555-5555-555555555555';

-- 6. Update David Kim
UPDATE public.tutors SET hourly_rate = 35 WHERE id = '66666666-6666-6666-6666-666666666666';

-- 7. General scaling for other tutors (like Piumal) who might have signed up during the USD phase
-- We'll scale them down by ~25% to align with UK market expectations
UPDATE public.tutors 
SET hourly_rate = ROUND(hourly_rate * 0.75) 
WHERE id NOT IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
) 
AND hourly_rate > 30;
