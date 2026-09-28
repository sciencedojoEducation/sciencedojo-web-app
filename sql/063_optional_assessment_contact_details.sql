-- Email is the required contact route for assessment enquiries.
-- Existing leads retain their values; new enquiries may omit these details.
ALTER TABLE public.assessment_leads
  ALTER COLUMN whatsapp_number DROP NOT NULL,
  ALTER COLUMN preferred_time DROP NOT NULL;
