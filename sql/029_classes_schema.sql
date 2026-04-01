-- 029_classes_schema.sql 🎓
-- Google Classroom-style collaboration hubs for ScienceDojo.
-- One class per (student, tutor, subject) triple.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CLASSES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  display_name TEXT NOT NULL,          -- e.g. "IB Math HL" (editable by tutor)
  cover_color TEXT DEFAULT '#6366f1',  -- accent hex for class card
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT classes_unique_triple UNIQUE (student_id, tutor_id, subject)
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Members (student + tutor) can view their own classes
DROP POLICY IF EXISTS "Class members can view their classes" ON public.classes;
CREATE POLICY "Class members can view their classes" ON public.classes
  FOR SELECT USING (
    auth.uid() = student_id OR auth.uid() = tutor_id
  );

-- Tutors can update class metadata (display_name, cover_color, archive)
DROP POLICY IF EXISTS "Tutors can update their classes" ON public.classes;
CREATE POLICY "Tutors can update their classes" ON public.classes
  FOR UPDATE USING (auth.uid() = tutor_id);

-- System (service role) inserts classes; also allow tutor/student to insert
DROP POLICY IF EXISTS "Members can create classes" ON public.classes;
CREATE POLICY "Members can create classes" ON public.classes
  FOR INSERT WITH CHECK (
    auth.uid() = student_id OR auth.uid() = tutor_id
  );

-- Admins can view all classes
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
CREATE POLICY "Admins can view all classes" ON public.classes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CLASS POSTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'post'
    CHECK (post_type IN ('post', 'assignment', 'lesson_report', 'link')),
  link_url TEXT,             -- for link/youtube embeds
  due_date TIMESTAMPTZ,      -- for assignments
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  file_url TEXT,             -- attached file (paper/worksheet)
  file_name TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.class_posts ENABLE ROW LEVEL SECURITY;

-- Class members can view posts in their classes
DROP POLICY IF EXISTS "Class members can view posts" ON public.class_posts;
CREATE POLICY "Class members can view posts" ON public.class_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_posts.class_id
        AND (student_id = auth.uid() OR tutor_id = auth.uid())
    )
  );

-- Class members can create posts in their classes
DROP POLICY IF EXISTS "Class members can create posts" ON public.class_posts;
CREATE POLICY "Class members can create posts" ON public.class_posts
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_posts.class_id
        AND (student_id = auth.uid() OR tutor_id = auth.uid())
    )
  );

-- Tutors can update posts (pin/unpin) in their classes
DROP POLICY IF EXISTS "Tutors can update posts in their classes" ON public.class_posts;
CREATE POLICY "Tutors can update posts in their classes" ON public.class_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_posts.class_id AND tutor_id = auth.uid()
    )
  );

-- Authors can delete their own posts
DROP POLICY IF EXISTS "Authors can delete their own posts" ON public.class_posts;
CREATE POLICY "Authors can delete their own posts" ON public.class_posts
  FOR DELETE USING (author_id = auth.uid());

-- Admins can view all posts
DROP POLICY IF EXISTS "Admins can view all class posts" ON public.class_posts;
CREATE POLICY "Admins can view all class posts" ON public.class_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CLASS COMMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.class_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,            -- for homework submission attachments
  file_name TEXT,
  is_submission BOOLEAN DEFAULT FALSE,  -- marks this as a homework submission
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.class_comments ENABLE ROW LEVEL SECURITY;

-- Class members can view comments on posts in their classes
DROP POLICY IF EXISTS "Class members can view comments" ON public.class_comments;
CREATE POLICY "Class members can view comments" ON public.class_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_posts cp
      JOIN public.classes c ON c.id = cp.class_id
      WHERE cp.id = class_comments.post_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- Class members can create comments
DROP POLICY IF EXISTS "Class members can create comments" ON public.class_comments;
CREATE POLICY "Class members can create comments" ON public.class_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.class_posts cp
      JOIN public.classes c ON c.id = cp.class_id
      WHERE cp.id = class_comments.post_id
        AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- Authors can delete their own comments
DROP POLICY IF EXISTS "Authors can delete their own comments" ON public.class_comments;
CREATE POLICY "Authors can delete their own comments" ON public.class_comments
  FOR DELETE USING (author_id = auth.uid());

-- Admins can view all comments
DROP POLICY IF EXISTS "Admins can view all class comments" ON public.class_comments;
CREATE POLICY "Admins can view all class comments" ON public.class_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. LINK BOOKINGS → CLASSES
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. STORAGE BUCKET — class-files
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-files', 
  'class-files', 
  true,
  10485760,  -- 10MB
  ARRAY['application/pdf','image/png','image/jpeg','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload class files
DROP POLICY IF EXISTS "Authenticated users can upload class files" ON storage.objects;
CREATE POLICY "Authenticated users can upload class files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'class-files' AND auth.role() = 'authenticated'
  );

-- Anyone (public) can read class files
DROP POLICY IF EXISTS "Class files are publicly readable" ON storage.objects;
CREATE POLICY "Class files are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'class-files');

-- Owners can delete their own class files
DROP POLICY IF EXISTS "Owners can delete class files" ON storage.objects;
CREATE POLICY "Owners can delete class files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'class-files' AND auth.uid() = owner
  );


DO $$
BEGIN
  RAISE NOTICE 'Classes Schema Applied! 🎓🥋';
END $$;
