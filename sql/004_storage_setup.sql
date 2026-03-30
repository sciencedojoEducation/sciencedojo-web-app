-- 4. Initializing Supabase Storage for Avatars
-- Note: Run this in the Supabase SQL Editor

-- 1. Create a public 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS Policies for the 'avatars' bucket
-- (Allow anyone to view avatars)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- (Allow authenticated users to upload their own avatar)
-- We use the file path 'avatars/{user_id}-{timestamp}.ext' to identify owners
DROP POLICY IF EXISTS "Tutors can upload their own avatars" ON storage.objects;
CREATE POLICY "Tutors can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'avatars'
  );

DROP POLICY IF EXISTS "Tutors can update their own avatars" ON storage.objects;
CREATE POLICY "Tutors can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'avatars'
  );

DROP POLICY IF EXISTS "Tutors can delete their own avatars" ON storage.objects;
CREATE POLICY "Tutors can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'avatars'
  );
