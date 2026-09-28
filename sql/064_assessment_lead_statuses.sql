-- Match the assessment intake and admin pipeline to the lead status constraint.
-- Legacy statuses remain valid for leads created before the current workflow.
ALTER TABLE public.assessment_leads
  DROP CONSTRAINT IF EXISTS assessment_leads_status_check;

ALTER TABLE public.assessment_leads
  ADD CONSTRAINT assessment_leads_status_check
  CHECK (status IN (
    'new_inquiry', 'awaiting_review', 'consultation_booked',
    'tutor_matched', 'converted', 'inactive',
    'new', 'contacted', 'booked', 'closed'
  ));
