-- Reviewed contingency only. Do not execute without the scoped hosted approval.
-- Roll back the application to the prior protected owner Preview first.
-- New additive tables remain RLS-protected, empty and inaccessible for inspection.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $guard$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.campus_runtime(uuid,text,jsonb,text,uuid,boolean)') AND md5(prosrc)='21ac7ce6568fb4dc1b5e2fdc404f33c6') THEN RAISE EXCEPTION 'Unexpected campus_runtime; stop and inspect'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.campus_game(uuid,text,text,jsonb,text,jsonb,text)') AND md5(prosrc)='0e085c42b91d1ac14a3cfe3dfa45b138') THEN RAISE EXCEPTION 'Unexpected campus_game; stop and inspect'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.campus_play(uuid,text,jsonb,text,jsonb,text)') AND md5(prosrc)='07264f0a79b1c7b698837ad8fdedaebe') THEN RAISE EXCEPTION 'Unexpected campus_play; stop and inspect'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.campus_runtime_before_play(uuid,text,jsonb,text,uuid,boolean)') AND md5(prosrc)='8adafe8c10039412724a99b3ab5eebbb') THEN RAISE EXCEPTION 'Unexpected preserved campus_runtime_before_play; stop and inspect'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.campus_game_unlocated(uuid,text,text,jsonb)') AND md5(prosrc)='799024042d23ff9780e4f19227e4f3b2') THEN RAISE EXCEPTION 'Unexpected preserved campus_game_unlocated; stop and inspect'; END IF;
END; $guard$;
DELETE FROM public.campus_play_invites WHERE state IN ('pending','accepted');
DELETE FROM public.campus_play_keys WHERE connection IS NOT NULL;
DELETE FROM public.campus_play_limits WHERE connection IS NOT NULL;
DELETE FROM public.campus_play_backoff WHERE sender IS NOT NULL;
DELETE FROM public.campus_game_members WHERE table_id IN ('four','boxes','wortquest');
UPDATE public.campus_game_tables SET state=NULL,quiz_level='A1',round=gen_random_uuid(),version=version+1 WHERE table_id IN ('four','boxes','wortquest');
REVOKE ALL ON FUNCTION public.campus_play(uuid,text,jsonb,text,jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
DROP FUNCTION public.campus_game(uuid,text,text,jsonb,text,jsonb,text);
ALTER FUNCTION public.campus_game_unlocated(uuid,text,text,jsonb) RENAME TO campus_game;
GRANT EXECUTE ON FUNCTION public.campus_game(uuid,text,text,jsonb) TO service_role;
DROP FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean);
ALTER FUNCTION public.campus_runtime_before_play(uuid,text,jsonb,text,uuid,boolean) RENAME TO campus_runtime;
GRANT EXECUTE ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
