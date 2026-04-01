-- Add Stripe Connect fields to tutors table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tutors' AND column_name='stripe_account_id') THEN
        ALTER TABLE public.tutors ADD COLUMN stripe_account_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tutors' AND column_name='stripe_onboarding_complete') THEN
        ALTER TABLE public.tutors ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
