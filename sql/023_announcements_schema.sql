-- 023_announcements_schema.sql 🛡️📢🥋
-- Platform-wide news and role-based announcements.

-- 1. Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'all', -- all, tutor, parent, student
  is_pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies
-- Admins have full access to manage announcements
DROP POLICY IF EXISTS "Admins have full access to announcements" ON public.announcements;
CREATE POLICY "Admins have full access to announcements" ON public.announcements
  FOR ALL TO authenticated USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Users can only see announcements targeted at their role or 'all'
DROP POLICY IF EXISTS "Users can view relevant announcements" ON public.announcements;
CREATE POLICY "Users can view relevant announcements" ON public.announcements
  FOR SELECT TO authenticated USING (
    is_active = true AND (
      target_role = 'all' OR 
      target_role = (auth.jwt() -> 'user_metadata' ->> 'role')
    )
  );

DO $$ 
BEGIN
  RAISE NOTICE 'Announcements Engine Schema Applied! 🛡️📢🥋';
END $$;
