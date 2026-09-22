-- Repair migration for environments where 054_dashboard_badge_views.sql was
-- not applied. Every statement is safe to run more than once.

CREATE TABLE IF NOT EXISTS public.dashboard_badge_views (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL CHECK (
    badge_key IN (
      'subscriptionIssues',
      'bookingPayments',
      'messages',
      'studentMissions',
      'tutorRequests',
      'missionReviews',
      'projectIdeas',
      'assessmentLeads',
      'safeguards',
      'manageTutors'
    )
  ),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_key)
);

ALTER TABLE public.dashboard_badge_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own dashboard badge views"
  ON public.dashboard_badge_views;
CREATE POLICY "Users read own dashboard badge views"
  ON public.dashboard_badge_views FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own dashboard badge views"
  ON public.dashboard_badge_views;
CREATE POLICY "Users create own dashboard badge views"
  ON public.dashboard_badge_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own dashboard badge views"
  ON public.dashboard_badge_views;
CREATE POLICY "Users update own dashboard badge views"
  ON public.dashboard_badge_views FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.touch_bookings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_touch_updated_at ON public.bookings;
CREATE TRIGGER bookings_touch_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_bookings_updated_at();

ALTER TABLE public.student_missions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.touch_student_missions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_missions_touch_updated_at
  ON public.student_missions;
CREATE TRIGGER student_missions_touch_updated_at
  BEFORE UPDATE ON public.student_missions
  FOR EACH ROW EXECUTE FUNCTION public.touch_student_missions_updated_at();

CREATE INDEX IF NOT EXISTS dashboard_badge_views_user_idx
  ON public.dashboard_badge_views(user_id, badge_key, viewed_at DESC);

NOTIFY pgrst, 'reload schema';
