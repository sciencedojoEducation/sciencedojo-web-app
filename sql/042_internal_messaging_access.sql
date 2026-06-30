CREATE OR REPLACE FUNCTION public.is_active_internal_member(target_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.internal_team_members
    WHERE user_id = target_user_id
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view basic profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (
      NOT public.is_active_internal_member(auth.uid())
      AND role IS DISTINCT FROM 'internal'
    )
    OR (
      public.is_active_internal_member(auth.uid())
      AND (
        role = 'admin'
        OR public.is_active_internal_member(id)
      )
    )
  );

DROP POLICY IF EXISTS "Internal members can view staff profiles" ON public.profiles;
CREATE POLICY "Internal members can view staff profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_active_internal_member(auth.uid())
    AND (
      id = auth.uid()
      OR role = 'admin'
      OR public.is_active_internal_member(id)
    )
  );

DROP POLICY IF EXISTS "Users can create conversations they are part of" ON public.conversations;
CREATE POLICY "Users can create conversations they are part of"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
    AND (
      NOT public.is_active_internal_member(auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = CASE
          WHEN participant_1_id = auth.uid() THEN participant_2_id
          ELSE participant_1_id
        END
        AND (
          role = 'admin'
          OR public.is_active_internal_member(id)
        )
      )
    )
  );
