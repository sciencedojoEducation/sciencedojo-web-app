-- Create the platform_integrations table for storing sensitive API keys
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE, -- 'stripe', 'zoom', etc.
  key_1 text, -- e.g., STRIPE_SECRET_KEY or ZOOM_ACCOUNT_ID
  key_2 text, -- e.g., STRIPE_WEBHOOK_SECRET or ZOOM_CLIENT_ID
  key_3 text, -- e.g., ZOOM_CLIENT_SECRET
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

-- ONLY admins can read these keys
DROP POLICY IF EXISTS "Allow admins to read integrations" ON public.platform_integrations;
CREATE POLICY "Allow admins to read integrations" ON public.platform_integrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ONLY admins can update/insert keys
DROP POLICY IF EXISTS "Allow admins to insert integrations" ON public.platform_integrations;
CREATE POLICY "Allow admins to insert integrations" ON public.platform_integrations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Allow admins to update integrations" ON public.platform_integrations;
CREATE POLICY "Allow admins to update integrations" ON public.platform_integrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Allow admins to delete integrations" ON public.platform_integrations;
CREATE POLICY "Allow admins to delete integrations" ON public.platform_integrations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Helper trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ts_platform_integrations ON public.platform_integrations;
CREATE TRIGGER ts_platform_integrations
  BEFORE UPDATE ON public.platform_integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default rows (inactive initially)
INSERT INTO public.platform_integrations (provider, is_active)
VALUES 
  ('stripe', false),
  ('zoom', false),
  ('google_calendar', false)
ON CONFLICT (provider) DO NOTHING;
