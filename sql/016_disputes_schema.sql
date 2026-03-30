-- Admin Dispute Management Schema
-- Note: Run this in the Supabase SQL Editor

-- Create Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Policies for Disputes
-- 1. Admins can view all disputes
CREATE POLICY "Admins can view and manage all disputes" ON public.disputes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Users can view disputes they reported
CREATE POLICY "Users can view their reported disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = reporter_id);

-- 3. Users can create disputes (Report an Issue)
CREATE POLICY "Users can report disputes" ON public.disputes
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
      AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
    )
  );

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dispute_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Add is_disputed to bookings to help filter in UI
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_disputed boolean DEFAULT false;

-- Trigger to auto-flag booking on dispute
CREATE OR REPLACE FUNCTION public.handle_dispute_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.bookings
  SET is_disputed = true
  WHERE id = NEW.booking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dispute_created
  AFTER INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.handle_dispute_insert();
