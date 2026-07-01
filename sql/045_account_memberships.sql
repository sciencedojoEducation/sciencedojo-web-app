-- General user accounts and additive memberships.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'parent', 'student', 'tutor', 'admin', 'internal'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, student_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    LOWER(NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'student_name'
  );

  IF (NEW.raw_user_meta_data->>'role' = 'tutor') THEN
    INSERT INTO public.tutors (id, bio, subjects, hourly_rate, is_verified)
    VALUES (NEW.id, '', '{}', 0, false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.account_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  membership_key TEXT NOT NULL CHECK (
    membership_key IN (
      'sciencedojo_student',
      'parent',
      'tutor',
      'internal',
      'admin'
    )
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, membership_key)
);

CREATE INDEX IF NOT EXISTS account_memberships_user_status_idx
  ON public.account_memberships (user_id, status);

ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memberships" ON public.account_memberships;
CREATE POLICY "Users can view own memberships" ON public.account_memberships
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all memberships" ON public.account_memberships;
CREATE POLICY "Admins can view all memberships" ON public.account_memberships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE OR REPLACE FUNCTION public.set_account_membership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS account_memberships_set_updated_at ON public.account_memberships;
CREATE TRIGGER account_memberships_set_updated_at
  BEFORE UPDATE ON public.account_memberships
  FOR EACH ROW EXECUTE PROCEDURE public.set_account_membership_updated_at();

INSERT INTO public.account_memberships (user_id, membership_key, status)
SELECT id, 'sciencedojo_student', 'active'
FROM public.profiles
WHERE role = 'student'
ON CONFLICT (user_id, membership_key) DO UPDATE SET status = 'active';

INSERT INTO public.account_memberships (user_id, membership_key, status)
SELECT id, role, 'active'
FROM public.profiles
WHERE role IN ('parent', 'tutor', 'internal', 'admin')
ON CONFLICT (user_id, membership_key) DO UPDATE SET status = 'active';
