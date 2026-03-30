-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) UNIQUE, -- 1 review per booking
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    tutor_id UUID NOT NULL REFERENCES public.tutors(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reviews
CREATE POLICY "Allow public read access to reviews"
    ON public.reviews FOR SELECT
    USING (true);

-- Allow authenticated users to insert reviews (api route will use service role anyway, but just in case)
CREATE POLICY "Allow authenticated users to insert reviews for their bookings"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = student_id);
