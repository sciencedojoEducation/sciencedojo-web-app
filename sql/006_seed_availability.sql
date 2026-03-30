-- Seed availability slots for all existing tutors to allow booking tests

DO $$
DECLARE
  tutor_record RECORD;
  loop_date DATE;
  i INT;
BEGIN
  -- Loop through all existing tutors
  FOR tutor_record IN SELECT id FROM public.tutors
  LOOP
    -- For each tutor, insert some availability for the next 5 days
    FOR i IN 1..5
    LOOP
      loop_date := (CURRENT_DATE + i * INTERVAL '1 day')::DATE;
      
      -- Insert 3 slots per day (9am, 11am, 2pm)
      INSERT INTO public.tutor_availability (tutor_id, date, start_time, end_time)
      VALUES 
        (tutor_record.id, loop_date, '09:00:00', '10:00:00'),
        (tutor_record.id, loop_date, '11:00:00', '12:00:00'),
        (tutor_record.id, loop_date, '14:00:00', '15:00:00')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
