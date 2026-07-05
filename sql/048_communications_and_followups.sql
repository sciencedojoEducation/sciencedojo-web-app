-- 048: Communication preferences, email events, and platform announcements.

CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  account_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_emails_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  service_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  product_updates_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  tutor_growth_emails_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribed_all BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  category TEXT NOT NULL,
  audience TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  category TEXT NOT NULL DEFAULT 'product',
  send_email BOOLEAN NOT NULL DEFAULT FALSE,
  show_dashboard BOOLEAN NOT NULL DEFAULT TRUE,
  show_public_updates_page BOOLEAN NOT NULL DEFAULT FALSE,
  cta_label TEXT,
  cta_url TEXT,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_events
  DROP CONSTRAINT IF EXISTS email_events_status_check;
ALTER TABLE public.email_events
  ADD CONSTRAINT email_events_status_check CHECK (status IN ('pending', 'sent', 'failed', 'skipped'));

ALTER TABLE public.email_events
  DROP CONSTRAINT IF EXISTS email_events_category_check;
ALTER TABLE public.email_events
  ADD CONSTRAINT email_events_category_check CHECK (category IN ('account', 'onboarding', 'service', 'product', 'tutor_growth', 'policy'));

ALTER TABLE public.platform_announcements
  DROP CONSTRAINT IF EXISTS platform_announcements_audience_check;
ALTER TABLE public.platform_announcements
  ADD CONSTRAINT platform_announcements_audience_check CHECK (audience IN ('all', 'tutor', 'parent', 'student', 'user'));

ALTER TABLE public.platform_announcements
  DROP CONSTRAINT IF EXISTS platform_announcements_category_check;
ALTER TABLE public.platform_announcements
  ADD CONSTRAINT platform_announcements_category_check CHECK (category IN ('account', 'onboarding', 'service', 'product', 'tutor_growth', 'policy'));

DROP POLICY IF EXISTS "Users can read own email preferences" ON public.email_preferences;
CREATE POLICY "Users can read own email preferences"
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email preferences" ON public.email_preferences;
CREATE POLICY "Users can update own email preferences"
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage email preferences" ON public.email_preferences;
CREATE POLICY "Admins manage email preferences"
  ON public.email_preferences FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can read own email events" ON public.email_events;
CREATE POLICY "Users can read own email events"
  ON public.email_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage email events" ON public.email_events;
CREATE POLICY "Admins manage email events"
  ON public.email_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users read active dashboard announcements" ON public.platform_announcements;
CREATE POLICY "Users read active dashboard announcements"
  ON public.platform_announcements FOR SELECT
  USING (
    is_active = TRUE
    AND show_dashboard = TRUE
    AND starts_at <= timezone('utc'::text, now())
    AND (ends_at IS NULL OR ends_at >= timezone('utc'::text, now()))
  );

DROP POLICY IF EXISTS "Admins manage platform announcements" ON public.platform_announcements;
CREATE POLICY "Admins manage platform announcements"
  ON public.platform_announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS email_events_dedupe_idx
  ON public.email_events (user_id, template_key, status, sent_at);

CREATE INDEX IF NOT EXISTS platform_announcements_visibility_idx
  ON public.platform_announcements (audience, is_active, show_dashboard, show_public_updates_page, starts_at);

INSERT INTO public.email_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
