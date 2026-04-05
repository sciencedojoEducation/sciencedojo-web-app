-- 034_student_missions.sql

CREATE TYPE mission_tier_enum AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'improvement_drill');

CREATE TABLE IF NOT EXISTS public.student_missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mission_tier mission_tier_enum NOT NULL DEFAULT 'daily',
  booking_ids UUID[] NOT NULL DEFAULT '{}',
  mission_blueprint JSONB NOT NULL,
  student_answers JSONB,
  ai_evaluation JSONB,
  score_percentage INTEGER,
  weak_topics TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_assessment', -- pending_assessment, pending_tutor_approval, completed
  tutor_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.student_missions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view and update their own missions" ON public.student_missions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Tutors can view and update missions assigned to them" ON public.student_missions
  FOR ALL USING (tutor_id = auth.uid());

CREATE POLICY "Admins can view all missions" ON public.student_missions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to ensure students don't spam daily missions (Can also be checked application-side)
