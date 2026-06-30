ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('parent', 'student', 'tutor', 'admin', 'internal'));

DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view basic profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    role IS DISTINCT FROM 'internal'
    OR id = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Internal members can view own team profile" ON public.internal_team_members;
CREATE POLICY "Internal members can view own team profile"
  ON public.internal_team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
