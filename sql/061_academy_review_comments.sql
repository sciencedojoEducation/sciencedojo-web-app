-- Invitation-only review of immutable Academy snapshots.
CREATE TABLE IF NOT EXISTS public.academy_review_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.academy_course_snapshots(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS academy_review_invitations_course_idx
  ON public.academy_review_invitations(course_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.academy_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.academy_review_invitations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.academy_course_snapshots(id) ON DELETE CASCADE,
  lesson_id TEXT,
  block_id TEXT,
  parent_id UUID REFERENCES public.academy_review_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS academy_review_comments_invitation_idx
  ON public.academy_review_comments(invitation_id, created_at);

-- Keep replies inside the same invitation, including for clients that bypass the UI.
CREATE OR REPLACE FUNCTION public.check_academy_review_reply()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.academy_review_comments parent
    WHERE parent.id = NEW.parent_id
      AND parent.invitation_id = NEW.invitation_id
      AND parent.course_id = NEW.course_id
      AND parent.snapshot_id = NEW.snapshot_id
  ) THEN
    RAISE EXCEPTION 'Review replies must belong to the same invitation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS academy_review_reply_scope ON public.academy_review_comments;
CREATE TRIGGER academy_review_reply_scope
  BEFORE INSERT OR UPDATE OF parent_id, invitation_id, course_id, snapshot_id
  ON public.academy_review_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_academy_review_reply();

ALTER TABLE public.academy_review_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_review_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage Academy review invitations" ON public.academy_review_invitations;
CREATE POLICY "Admins manage Academy review invitations"
  ON public.academy_review_invitations FOR ALL TO authenticated
  USING (public.current_user_is_academy_admin())
  WITH CHECK (public.current_user_is_academy_admin());

DROP POLICY IF EXISTS "Invitees read their active Academy reviews" ON public.academy_review_invitations;
CREATE POLICY "Invitees read their active Academy reviews"
  ON public.academy_review_invitations FOR SELECT TO authenticated
  USING (
    lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    AND revoked_at IS NULL AND expires_at > NOW()
  );

DROP POLICY IF EXISTS "Invitees read Academy review snapshots" ON public.academy_course_snapshots;
CREATE POLICY "Invitees read Academy review snapshots"
  ON public.academy_course_snapshots FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_review_invitations invitation
    WHERE invitation.snapshot_id = academy_course_snapshots.id
      AND lower(invitation.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND invitation.revoked_at IS NULL AND invitation.expires_at > NOW()
  ));

DROP POLICY IF EXISTS "Admins manage Academy review comments" ON public.academy_review_comments;
CREATE POLICY "Admins manage Academy review comments"
  ON public.academy_review_comments FOR ALL TO authenticated
  USING (public.current_user_is_academy_admin())
  WITH CHECK (public.current_user_is_academy_admin());

DROP POLICY IF EXISTS "Invitees read Academy review comments" ON public.academy_review_comments;
CREATE POLICY "Invitees read Academy review comments"
  ON public.academy_review_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_review_invitations invitation
    WHERE invitation.id = invitation_id
      AND lower(invitation.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND invitation.revoked_at IS NULL AND invitation.expires_at > NOW()
  ));

DROP POLICY IF EXISTS "Invitees add Academy review comments" ON public.academy_review_comments;
CREATE POLICY "Invitees add Academy review comments"
  ON public.academy_review_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND resolved_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.academy_review_invitations invitation
      WHERE invitation.id = invitation_id
        AND invitation.course_id = course_id
        AND invitation.snapshot_id = snapshot_id
        AND lower(invitation.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND invitation.revoked_at IS NULL AND invitation.expires_at > NOW()
    )
  );

NOTIFY pgrst, 'reload schema';
