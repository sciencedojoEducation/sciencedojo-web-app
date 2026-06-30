-- Phase 39: Admin-controlled feature flags

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  category text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS feature_flags_category_idx ON public.feature_flags(category);
CREATE INDEX IF NOT EXISTS feature_flags_enabled_idx ON public.feature_flags(enabled);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert feature flags" ON public.feature_flags;
CREATE POLICY "Admins can insert feature flags" ON public.feature_flags
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags;
CREATE POLICY "Admins can update feature flags" ON public.feature_flags
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can delete feature flags" ON public.feature_flags;
CREATE POLICY "Admins can delete feature flags" ON public.feature_flags
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

INSERT INTO public.feature_flags (key, label, description, enabled, category)
VALUES
  ('tutor_marketplace_enabled', 'Tutor marketplace', 'Show public and dashboard tutor discovery surfaces.', false, 'Tutor Marketplace'),
  ('tutor_profiles_enabled', 'Tutor profiles', 'Allow public tutor profile pages to be viewed by families.', false, 'Tutor Marketplace'),
  ('booking_enabled', 'Booking', 'Allow families and students to request tutor bookings.', false, 'Booking & Payments'),
  ('free_assessment_enabled', 'Free assessment', 'Show the free learning assessment form and related CTAs.', false, 'Public Website'),
  ('practice_dojo_enabled', 'Practice Dojo', 'Show Practice Dojo public learning tools and CTAs.', false, 'AI / Practice Tools'),
  ('ai_practice_generator_enabled', 'AI practice generator', 'Allow AI-backed practice question generation routes.', false, 'AI / Practice Tools'),
  ('learning_hub_enabled', 'Learning Hub', 'Show public Learning Hub articles and index pages.', false, 'Public Website'),
  ('parent_dashboard_enabled', 'Parent dashboard', 'Allow parent users to access the parent dashboard experience.', false, 'Dashboards'),
  ('student_dashboard_enabled', 'Student dashboard', 'Allow student users to access the student dashboard experience.', false, 'Dashboards'),
  ('tutor_dashboard_enabled', 'Tutor dashboard', 'Allow tutors to access the tutor dashboard experience.', false, 'Dashboards'),
  ('tutor_applications_enabled', 'Tutor applications', 'Allow new tutor onboarding applications.', false, 'Tutor Marketplace'),
  ('stripe_payments_enabled', 'Stripe payments', 'Allow checkout sessions for accepted bookings.', false, 'Booking & Payments'),
  ('reviews_enabled', 'Reviews', 'Show review collection and public review surfaces.', true, 'Growth / Beta'),
  ('maintenance_mode_enabled', 'Maintenance mode', 'Show a premium maintenance screen for public pages while admin access remains open.', false, 'System'),
  ('beta_mode_enabled', 'Beta mode', 'Reserve beta-only product messaging and access controls.', false, 'Growth / Beta')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

CREATE OR REPLACE FUNCTION public.touch_feature_flags_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feature_flags_touch_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_touch_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_feature_flags_updated_at();
