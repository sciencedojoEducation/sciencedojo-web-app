-- Initialize Messaging Storage for Files
-- Note: Run this in the Supabase SQL Editor

-- 1. Create a private 'message-attachments' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS Policies for the 'message-attachments' bucket
-- Allow thread participants to download files from their conversations
DROP POLICY IF EXISTS "Participants can download their attachments" ON storage.objects;
CREATE POLICY "Participants can download their attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-attachments' AND 
    (
      EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON m.conversation_id = c.id
        WHERE m.file_url LIKE '%' || storage.objects.name || '%'
        AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
      ) OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Allow authenticated users to upload files to a temporary or message-specific path
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-attachments' AND 
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Owners can delete their own attachments" ON storage.objects;
CREATE POLICY "Owners can delete their own attachments" ON storage.objects
  FOR DELETE USING (
     bucket_id = 'message-attachments' AND 
     auth.uid() = owner
  );
