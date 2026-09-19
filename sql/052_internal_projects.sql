-- Internal project ideas, assignments, and delivery activity.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.internal_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  brief TEXT NOT NULL CHECK (char_length(brief) BETWEEN 10 AND 6000),
  expected_outcome TEXT NOT NULL CHECK (char_length(expected_outcome) BETWEEN 3 AND 3000),
  priority TEXT NOT NULL DEFAULT 'p2' CHECK (priority IN ('p0', 'p1', 'p2', 'p3', 'research', 'hold')),
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued')),
  assigned_to UUID REFERENCES public.internal_team_members(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_date DATE,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.internal_project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.internal_projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'brief_updated', 'assignment_changed', 'status_changed', 'progress_note', 'archived', 'restored')),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 3000),
  previous_status TEXT CHECK (previous_status IS NULL OR previous_status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued')),
  new_status TEXT CHECK (new_status IS NULL OR new_status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS internal_projects_assigned_to_idx ON public.internal_projects(assigned_to);
CREATE INDEX IF NOT EXISTS internal_projects_status_idx ON public.internal_projects(status);
CREATE INDEX IF NOT EXISTS internal_projects_priority_idx ON public.internal_projects(priority);
CREATE INDEX IF NOT EXISTS internal_projects_archived_at_idx ON public.internal_projects(archived_at);
CREATE INDEX IF NOT EXISTS internal_projects_updated_at_idx ON public.internal_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS internal_project_activity_project_created_idx ON public.internal_project_activity(project_id, created_at DESC);

-- Keep this migration safe to rerun if an earlier draft of the project board was applied.
ALTER TABLE public.internal_projects DROP CONSTRAINT IF EXISTS internal_projects_priority_check;
ALTER TABLE public.internal_projects DROP CONSTRAINT IF EXISTS internal_projects_status_check;
ALTER TABLE public.internal_project_activity DROP CONSTRAINT IF EXISTS internal_project_activity_previous_status_check;
ALTER TABLE public.internal_project_activity DROP CONSTRAINT IF EXISTS internal_project_activity_new_status_check;

UPDATE public.internal_projects SET priority = CASE priority
  WHEN 'high' THEN 'p1' WHEN 'medium' THEN 'p2' WHEN 'low' THEN 'p3' ELSE priority END
WHERE priority IN ('high', 'medium', 'low');
UPDATE public.internal_projects SET status = CASE status
  WHEN 'in_progress' THEN 'in_development' WHEN 'blocked' THEN 'paused' WHEN 'done' THEN 'live' ELSE status END
WHERE status IN ('in_progress', 'blocked', 'done');
UPDATE public.internal_project_activity SET previous_status = CASE previous_status
  WHEN 'in_progress' THEN 'in_development' WHEN 'blocked' THEN 'paused' WHEN 'done' THEN 'live' ELSE previous_status END
WHERE previous_status IN ('in_progress', 'blocked', 'done');
UPDATE public.internal_project_activity SET new_status = CASE new_status
  WHEN 'in_progress' THEN 'in_development' WHEN 'blocked' THEN 'paused' WHEN 'done' THEN 'live' ELSE new_status END
WHERE new_status IN ('in_progress', 'blocked', 'done');

ALTER TABLE public.internal_projects
  ADD CONSTRAINT internal_projects_priority_check CHECK (priority IN ('p0', 'p1', 'p2', 'p3', 'research', 'hold')),
  ADD CONSTRAINT internal_projects_status_check CHECK (status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued'));
ALTER TABLE public.internal_project_activity
  ADD CONSTRAINT internal_project_activity_previous_status_check CHECK (previous_status IS NULL OR previous_status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued')),
  ADD CONSTRAINT internal_project_activity_new_status_check CHECK (new_status IS NULL OR new_status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued'));

CREATE OR REPLACE FUNCTION public.touch_internal_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS internal_projects_touch_updated_at ON public.internal_projects;
CREATE TRIGGER internal_projects_touch_updated_at
  BEFORE UPDATE ON public.internal_projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_internal_projects_updated_at();

ALTER TABLE public.internal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_project_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage internal projects" ON public.internal_projects;
CREATE POLICY "Admins manage internal projects"
  ON public.internal_projects
  FOR ALL TO authenticated
  USING (public.is_admin_profile())
  WITH CHECK (public.is_admin_profile());

DROP POLICY IF EXISTS "Assignees read own internal projects" ON public.internal_projects;
CREATE POLICY "Assignees read own internal projects"
  ON public.internal_projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.internal_team_members member
      WHERE member.id = internal_projects.assigned_to
        AND member.user_id = auth.uid()
        AND member.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admins manage internal project activity" ON public.internal_project_activity;
CREATE POLICY "Admins manage internal project activity"
  ON public.internal_project_activity
  FOR ALL TO authenticated
  USING (public.is_admin_profile())
  WITH CHECK (public.is_admin_profile());

DROP POLICY IF EXISTS "Assignees read own internal project activity" ON public.internal_project_activity;
CREATE POLICY "Assignees read own internal project activity"
  ON public.internal_project_activity
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.internal_projects project
      JOIN public.internal_team_members member ON member.id = project.assigned_to
      WHERE project.id = internal_project_activity.project_id
        AND member.user_id = auth.uid()
        AND member.status = 'active'
    )
  );

CREATE OR REPLACE FUNCTION public.update_assigned_internal_project(
  target_project_id UUID,
  requested_status TEXT DEFAULT NULL,
  progress_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_project public.internal_projects%ROWTYPE;
  clean_note TEXT := NULLIF(BTRIM(progress_note), '');
BEGIN
  SELECT project.*
  INTO current_project
  FROM public.internal_projects project
  JOIN public.internal_team_members member ON member.id = project.assigned_to
  WHERE project.id = target_project_id
    AND member.user_id = auth.uid()
    AND member.status = 'active'
    AND project.archived_at IS NULL
  FOR UPDATE OF project;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  IF requested_status IS NOT NULL THEN
    IF requested_status NOT IN ('exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused') THEN
      RAISE EXCEPTION 'Invalid internal project status';
    END IF;

    IF current_project.status IN ('live', 'discontinued') AND requested_status IS DISTINCT FROM current_project.status THEN
      RAISE EXCEPTION 'Live or discontinued projects can only be reopened by an admin';
    END IF;

    IF current_project.status = 'idea' AND requested_status NOT IN ('exploring', 'planned') THEN
      RAISE EXCEPTION 'New ideas must be explored or planned first';
    END IF;

    IF requested_status IS DISTINCT FROM current_project.status THEN
      UPDATE public.internal_projects
      SET status = requested_status
      WHERE id = target_project_id;

      INSERT INTO public.internal_project_activity (
        project_id, actor_id, activity_type, note, previous_status, new_status
      ) VALUES (
        target_project_id, auth.uid(), 'status_changed', clean_note, current_project.status, requested_status
      );

      clean_note := NULL;
    END IF;
  END IF;

  IF clean_note IS NOT NULL THEN
    IF char_length(clean_note) > 3000 THEN
      RAISE EXCEPTION 'Progress notes must be 3000 characters or fewer';
    END IF;

    INSERT INTO public.internal_project_activity (project_id, actor_id, activity_type, note)
    VALUES (target_project_id, auth.uid(), 'progress_note', clean_note);

    UPDATE public.internal_projects SET updated_at = NOW() WHERE id = target_project_id;
  END IF;

  IF requested_status IS NULL AND clean_note IS NULL THEN
    RAISE EXCEPTION 'Choose a status or add a progress note';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_assigned_internal_project(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_assigned_internal_project(UUID, TEXT, TEXT) TO authenticated;
