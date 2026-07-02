-- Prevent unknown OAuth callbacks from creating generic app profiles.
-- Google OAuth does not pass ScienceDojo's selected signup role into
-- auth.users.raw_user_meta_data before /auth/callback runs. If the trigger
-- defaults that missing role to "user", tutor/parent signup can be blocked as
-- "already registered" before the callback provisions the chosen role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  app_role TEXT := NEW.raw_user_meta_data->>'role';
BEGIN
  IF app_role IS NULL OR app_role NOT IN ('user', 'parent', 'student', 'tutor', 'admin', 'internal') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, student_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    LOWER(NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    app_role,
    NEW.raw_user_meta_data->>'student_name'
  );

  IF app_role = 'tutor' THEN
    INSERT INTO public.tutors (id, bio, subjects, hourly_rate, is_verified)
    VALUES (NEW.id, '', '{}', 0, false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Diagnostic checklist for a ghost test account. Replace the email before use.
-- SELECT id, email, raw_user_meta_data, created_at FROM auth.users WHERE LOWER(email) = LOWER('fitdojox@gmail.com');
-- SELECT id, email, role, created_at FROM public.profiles WHERE LOWER(email) = LOWER('fitdojox@gmail.com');
-- SELECT * FROM public.account_memberships WHERE user_id IN (SELECT id FROM public.profiles WHERE LOWER(email) = LOWER('fitdojox@gmail.com'));
-- SELECT * FROM public.tutors WHERE id IN (SELECT id FROM public.profiles WHERE LOWER(email) = LOWER('fitdojox@gmail.com'));
-- SELECT * FROM public.applications WHERE user_id IN (SELECT id FROM public.profiles WHERE LOWER(email) = LOWER('fitdojox@gmail.com'));
-- SELECT * FROM public.subscriptions WHERE user_id IN (SELECT id FROM public.profiles WHERE LOWER(email) = LOWER('fitdojox@gmail.com'));
