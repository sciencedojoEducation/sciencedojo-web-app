-- Create the platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_percent integer NOT NULL DEFAULT 25,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (so tutors can see their math, students theoretically too)
CREATE POLICY "Allow public read access to platform_settings" ON public.platform_settings
  FOR SELECT USING (true);

-- Allow only admins to update settings
CREATE POLICY "Allow admins to update platform_settings" ON public.platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to ensure only one row ever exists (singleton pattern)
CREATE OR REPLACE FUNCTION public.check_single_row_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM public.platform_settings) >= 1 THEN
    RAISE EXCEPTION 'Only one row is allowed in public.platform_settings';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce singleton pattern
DROP TRIGGER IF EXISTS trg_single_row_limit ON public.platform_settings;
CREATE TRIGGER trg_single_row_limit
  BEFORE INSERT ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.check_single_row_limit();

-- Insert the default configuration row (bypass trigger logic for the very first insert)
INSERT INTO public.platform_settings (platform_fee_percent) 
VALUES (25)
ON CONFLICT DO NOTHING;
