-- These endpoints are used only after authentication or inside protected RPCs.
-- Keep signed-in/service execution and all function bodies unchanged.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='15s';
REVOKE EXECUTE ON FUNCTION public.update_assigned_internal_project(uuid,text,text) FROM PUBLIC,anon;
REVOKE EXECUTE ON FUNCTION public.course_pilot_parent_visible(uuid) FROM PUBLIC,anon;
REVOKE EXECUTE ON FUNCTION public.course_pilot_valid_lesson(uuid,text) FROM PUBLIC,anon;
COMMIT;
NOTIFY pgrst,'reload schema';
