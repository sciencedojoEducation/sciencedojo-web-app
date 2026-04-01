-- 1. Create the `applications` table to hold unvetted tutor onboarding data
CREATE TABLE IF NOT EXISTS public.applications (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    university TEXT,
    subjects TEXT[] DEFAULT '{}',
    youtube_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policy: Applicant can read and update their own application
CREATE POLICY "Applicants can manage their own application" ON public.applications
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Admins can view and update all applications
CREATE POLICY "Admins can manage all applications" ON public.applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Create the `private_docs` storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('private_docs', 'private_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS on `private_docs`: Applicant owns their files, Admins can read them
CREATE POLICY "Applicant can upload private docs" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'private_docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Applicant can read own private docs" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'private_docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can read all private docs" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'private_docs' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

DO $$ 
BEGIN
  RAISE NOTICE 'Sensei Onboarding Database Foundation Built Successfully! 🚀';
END $$;
