-- Phase 14: Safety Oversight & Metrics 🛡️

-- 1. Profiles: Tracking violations and status
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS warning_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- 2. Messages: Tracking review status
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id);

-- 3. Policy: Ensure admins can update these new fields
DROP POLICY IF EXISTS "Admins can manage safety metrics" ON public.profiles;
CREATE POLICY "Admins can manage safety metrics" ON public.profiles
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

COMMENT ON COLUMN public.profiles.warning_count IS 'Incremental count of safety policy violations';
COMMENT ON COLUMN public.profiles.is_suspended IS 'Manual flag to prevent platform access if safety rules are repeatedly broken';
