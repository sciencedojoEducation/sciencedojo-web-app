-- Phase 15: Tutor Payouts Ledger 💸
-- Tracks every Stripe Transfer made from the platform to a tutor.

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'gbp',
  stripe_transfer_id text UNIQUE, -- Populated after Stripe Transfer succeeds
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone
);

-- Index for quick lookups by tutor
CREATE INDEX IF NOT EXISTS idx_payouts_tutor_id ON public.payouts(tutor_id);

-- RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Tutors can see their own payouts
DROP POLICY IF EXISTS "Tutors can view own payouts" ON public.payouts;
CREATE POLICY "Tutors can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = tutor_id);

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage payouts" ON public.payouts;
CREATE POLICY "Admins can manage payouts" ON public.payouts
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

COMMENT ON TABLE public.payouts IS 'Logs all Stripe transfers made from the platform account to connected tutor accounts.';
