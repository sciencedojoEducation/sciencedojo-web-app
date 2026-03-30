-- Add support for recurring bookings (blocks of lessons)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='recurrence_group_id') THEN
        ALTER TABLE public.bookings ADD COLUMN recurrence_group_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='is_recurring') THEN
        ALTER TABLE public.bookings ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='recurrence_count') THEN
        ALTER TABLE public.bookings ADD COLUMN recurrence_count INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='recurrence_index') THEN
        ALTER TABLE public.bookings ADD COLUMN recurrence_index INTEGER DEFAULT 1;
    END IF;
END $$;
