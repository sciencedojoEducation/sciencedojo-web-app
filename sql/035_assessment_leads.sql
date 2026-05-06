-- Free assessment lead capture for ScienceDojo.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.assessment_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_grade TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  subject_needed TEXT NOT NULL,
  main_challenge TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'booked', 'converted', 'closed')),
  source TEXT NOT NULL DEFAULT 'free_assessment_page',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessment_leads_status_idx ON public.assessment_leads(status);
CREATE INDEX IF NOT EXISTS assessment_leads_created_at_idx ON public.assessment_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS assessment_leads_email_idx ON public.assessment_leads(LOWER(email));

CREATE OR REPLACE FUNCTION public.set_assessment_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assessment_leads_set_updated_at ON public.assessment_leads;
CREATE TRIGGER assessment_leads_set_updated_at
  BEFORE UPDATE ON public.assessment_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assessment_leads_updated_at();

ALTER TABLE public.assessment_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view assessment leads" ON public.assessment_leads;
CREATE POLICY "Admins can view assessment leads" ON public.assessment_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update assessment leads" ON public.assessment_leads;
CREATE POLICY "Admins can update assessment leads" ON public.assessment_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public form submissions are inserted by the server action using the service role.
-- Do not add a broad public SELECT policy; leads contain private contact details.
