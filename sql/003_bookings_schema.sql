-- 3. Create Bookings Table (The Handshake System)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT, -- "What do you need help with?"
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'declined', 'confirmed', 'completed', 'cancelled')),
  meeting_url TEXT,
  price_at_booking NUMERIC NOT NULL,
  payment_intent_id TEXT, -- For Stripe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies for Bookings
-- 1. Parents can view their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- 2. Parents can create booking requests
DROP POLICY IF EXISTS "Students/Parents can create booking requests" ON public.bookings;
CREATE POLICY "Students/Parents can create booking requests" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 3. Both parties can update status (within limits)
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = tutor_id);
