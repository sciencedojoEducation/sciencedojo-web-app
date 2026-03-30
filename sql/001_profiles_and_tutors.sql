-- 0. Clean up existing tables to ensure a fresh schema reset
DROP TABLE IF EXISTS public.tutors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Create Public Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT, -- Stored as lowercase via trigger
  avatar_url TEXT,
  role TEXT CHECK (role IN ('parent', 'student', 'tutor', 'admin')),
  student_name TEXT, -- For parents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Case-insensitive unique index for emails
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (LOWER(email));

-- 2. Create Tutors Table
-- Detailed information for verified tutors
CREATE TABLE IF NOT EXISTS public.tutors (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  subjects TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available_now BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Profiles: Users can view all profiles, but only update their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Tutors: Everyone can view tutors, but only the tutor (or admin) can update their data
DROP POLICY IF EXISTS "Tutors are viewable by everyone" ON public.tutors;
CREATE POLICY "Tutors are viewable by everyone" ON public.tutors
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tutors can update own data" ON public.tutors;
CREATE POLICY "Tutors can update own data" ON public.tutors
  FOR UPDATE USING (auth.uid() = id);

-- 5. Trigger: Atomically Create Profile on Auth Signup
-- This function runs every time a user signs up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create the profile
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, student_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    LOWER(NEW.email), -- Normalize to lowercase
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    NEW.raw_user_meta_data->>'student_name'
  );

  -- 2. If the user is a tutor, auto-provision their tutor row
  IF (NEW.raw_user_meta_data->>'role' = 'tutor') THEN
    INSERT INTO public.tutors (id, bio, subjects, hourly_rate, is_verified)
    VALUES (NEW.id, '', '{}', 0, false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. SYNC SCRIPT: Backfill existing users (Run this once manually if needed)
-- This copies emails from auth.users to public.profiles where they might be missing
/*
INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, LOWER(email), 'parent', raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = LOWER(EXCLUDED.email)
WHERE public.profiles.email IS NULL;
*/
