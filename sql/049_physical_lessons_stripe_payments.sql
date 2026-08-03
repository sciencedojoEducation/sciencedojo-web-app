-- 049_physical_lessons_stripe_payments.sql
-- Adds physical lesson details and Stripe payment tracking.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS lesson_mode TEXT NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS location_details TEXT,
  ADD COLUMN IF NOT EXISTS arrival_notes TEXT,
  ADD COLUMN IF NOT EXISTS travel_fee NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_lesson_mode_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_lesson_mode_check
      CHECK (lesson_mode IN ('online', 'physical'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_payment_method_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('stripe'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_payment_status_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payment_status_check
      CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

UPDATE public.bookings
SET payment_status = 'paid',
    payment_method = COALESCE(payment_method, 'stripe')
WHERE status IN ('confirmed', 'completed')
  AND payment_status = 'unpaid';

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_lesson_mode ON public.bookings(lesson_mode);
