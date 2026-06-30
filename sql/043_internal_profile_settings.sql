ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND role IS DISTINCT FROM 'internal')
  WITH CHECK (auth.uid() = id AND role IS DISTINCT FROM 'internal');

DROP POLICY IF EXISTS "Internal members can update safe own profile fields" ON public.profiles;
CREATE POLICY "Internal members can update safe own profile fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND role = 'internal')
  WITH CHECK (id = auth.uid() AND role = 'internal');
