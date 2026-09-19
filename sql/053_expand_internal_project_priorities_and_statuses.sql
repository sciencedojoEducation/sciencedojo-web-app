-- Upgrade environments where the original 052 migration was already applied.
-- Separates roadmap priority from delivery status and preserves existing rows.

BEGIN;

ALTER TABLE public.internal_projects DROP CONSTRAINT IF EXISTS internal_projects_priority_check;
ALTER TABLE public.internal_projects DROP CONSTRAINT IF EXISTS internal_projects_status_check;
ALTER TABLE public.internal_project_activity DROP CONSTRAINT IF EXISTS internal_project_activity_previous_status_check;
ALTER TABLE public.internal_project_activity DROP CONSTRAINT IF EXISTS internal_project_activity_new_status_check;

UPDATE public.internal_projects SET priority = CASE priority
  WHEN 'high' THEN 'p1'
  WHEN 'medium' THEN 'p2'
  WHEN 'low' THEN 'p3'
  ELSE priority
END
WHERE priority IN ('high', 'medium', 'low');

UPDATE public.internal_projects SET status = CASE status
  WHEN 'in_progress' THEN 'in_development'
  WHEN 'blocked' THEN 'paused'
  WHEN 'done' THEN 'live'
  ELSE status
END
WHERE status IN ('in_progress', 'blocked', 'done');

UPDATE public.internal_project_activity SET previous_status = CASE previous_status
  WHEN 'in_progress' THEN 'in_development'
  WHEN 'blocked' THEN 'paused'
  WHEN 'done' THEN 'live'
  ELSE previous_status
END
WHERE previous_status IN ('in_progress', 'blocked', 'done');

UPDATE public.internal_project_activity SET new_status = CASE new_status
  WHEN 'in_progress' THEN 'in_development'
  WHEN 'blocked' THEN 'paused'
  WHEN 'done' THEN 'live'
  ELSE new_status
END
WHERE new_status IN ('in_progress', 'blocked', 'done');

ALTER TABLE public.internal_projects
  ALTER COLUMN priority SET DEFAULT 'p2',
  ADD CONSTRAINT internal_projects_priority_check
    CHECK (priority IN ('p0', 'p1', 'p2', 'p3', 'research', 'hold')),
  ADD CONSTRAINT internal_projects_status_check
    CHECK (status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued'));

ALTER TABLE public.internal_project_activity
  ADD CONSTRAINT internal_project_activity_previous_status_check
    CHECK (previous_status IS NULL OR previous_status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued')),
  ADD CONSTRAINT internal_project_activity_new_status_check
    CHECK (new_status IS NULL OR new_status IN ('idea', 'exploring', 'planned', 'in_development', 'testing', 'pilot', 'live', 'paused', 'discontinued'));

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
      UPDATE public.internal_projects SET status = requested_status WHERE id = target_project_id;

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

COMMIT;
