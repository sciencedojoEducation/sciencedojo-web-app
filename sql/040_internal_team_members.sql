CREATE TABLE IF NOT EXISTS public.internal_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'developer', 'support', 'tutor_manager', 'finance')),
  title TEXT,
  responsibility_area TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS internal_team_members_email_lower_idx
  ON public.internal_team_members (LOWER(email));

CREATE INDEX IF NOT EXISTS internal_team_members_role_idx
  ON public.internal_team_members (role);

CREATE INDEX IF NOT EXISTS internal_team_members_status_idx
  ON public.internal_team_members (status);

ALTER TABLE public.internal_team_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_profile()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Admins can view internal team members" ON public.internal_team_members;
CREATE POLICY "Admins can view internal team members"
  ON public.internal_team_members
  FOR SELECT
  TO authenticated
  USING (public.is_admin_profile());

DROP POLICY IF EXISTS "Admins can create internal team members" ON public.internal_team_members;
CREATE POLICY "Admins can create internal team members"
  ON public.internal_team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_profile());

DROP POLICY IF EXISTS "Admins can update internal team members" ON public.internal_team_members;
CREATE POLICY "Admins can update internal team members"
  ON public.internal_team_members
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_profile())
  WITH CHECK (public.is_admin_profile());

CREATE OR REPLACE FUNCTION public.touch_internal_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS internal_team_members_touch_updated_at ON public.internal_team_members;
CREATE TRIGGER internal_team_members_touch_updated_at
  BEFORE UPDATE ON public.internal_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_internal_team_members_updated_at();
