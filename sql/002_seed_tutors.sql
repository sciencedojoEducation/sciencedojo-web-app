-- SEEDING SCRIPT: ScienceDojo Initial Tutors (Phase 1)
-- Run this in the Supabase SQL Editor AFTER running 001_profiles_and_tutors.sql

-- First, create profile entries for the tutors (using deterministic placeholder UUIDs)
INSERT INTO public.profiles (id, full_name, role, avatar_url)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Dr. Sarah Jenkins', 'tutor', '/tutor_sarah.webp'),
  ('22222222-2222-2222-2222-222222222222', 'Michael Chen', 'tutor', '/tutor_michael.webp'),
  ('33333333-3333-3333-3333-333333333333', 'Elena Rodriguez', 'tutor', '/tutor_elena.webp'),
  ('44444444-4444-4444-4444-444444444444', 'James Wilson', 'tutor', '/tutor_james.webp'),
  ('55555555-5555-5555-5555-555555555555', 'Dr. Ananya Patel', 'tutor', '/tutor_ananya.webp'),
  ('66666666-6666-6666-6666-666666666666', 'David Kim', 'tutor', '/tutor_david.webp')
ON CONFLICT (id) DO NOTHING;

-- Then, populate the tutors table with their professional details
INSERT INTO public.tutors (id, bio, subjects, hourly_rate, rating, review_count, is_verified, is_available_now)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'PhD in Chemistry from MIT. Specializes in making complex molecular concepts simple and intuitive. Over 5 years of remote tutoring experience.', '{Chemistry}', 65, 4.9, 124, TRUE, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Former CERN researcher with a passion for teaching. I can help you understand classical mechanics, electromagnetism, and modern physics.', '{Physics}', 55, 4.8, 89, TRUE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'Math doesnt have to be scary! From Algebra to Calculus III, I focus on building a strong foundation and boosting your confidence.', '{Math}', 45, 5.0, 201, TRUE, TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Medical student who loves teaching biology. Specializing in AP Biology and college-level genetics. Lets make learning cell structure fun.', '{Biology}', 50, 4.7, 45, TRUE, TRUE),
  ('55555555-5555-5555-5555-555555555555', 'Ex-Google engineer teaching Python, JavaScript, and data structures. I will prepare you not just for exams, but for real-world problem solving.', '{Programming}', 85, 4.9, 156, TRUE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'General science expert for middle and high schoolers. My approach is hands-on and heavily uses visual aids to guarantee understanding.', '{Science}', 35, 4.6, 32, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;
