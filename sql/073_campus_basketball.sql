-- Shared, ephemeral court geometry. Local preparation only; not permission to apply hosted.
BEGIN;
CREATE FUNCTION public.campus_basketball_initial() RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT '{"x":52,"y":0.37,"z":0,"holder":null,"mode":"loose","north":0,"south":0,"event":0,"kind":"ready","points":0,"hoop":null,"vx":0,"vy":0,"vz":0,"at":0,"actionAt":-1000,"shot":false,"shotX":52,"shotZ":0}'::jsonb;
$$;
CREATE TABLE public.campus_basketball (
 room text PRIMARY KEY CHECK(room='library'),
 version bigint NOT NULL DEFAULT 0 CHECK(version>=0),
 state jsonb NOT NULL CHECK(jsonb_typeof(state)='object')
);
INSERT INTO public.campus_basketball(room,state) VALUES('library',public.campus_basketball_initial());
ALTER TABLE public.campus_basketball ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_basketball FROM PUBLIC,anon,authenticated,service_role;

-- All player geometry is for the trusted physics service. The existing per-viewer
-- snapshot and explicit JS projection alone form the public WebSocket payload.
CREATE FUNCTION public.campus_basketball_envelope() RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('version',version,'state',state,'now',extract(epoch FROM clock_timestamp())*1000,
  'players',coalesce((SELECT jsonb_agg(jsonb_build_object('id',campus_id,'x',x,'z',z,'rotation',rotation,'status',status) ORDER BY campus_id)
   FROM campus_presence WHERE lease_until>clock_timestamp() AND public.campus_allowed(campus_id)),'[]'::jsonb))
 FROM campus_basketball WHERE room='library';
$$;
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) RENAME TO campus_runtime_school;
REVOKE ALL ON FUNCTION public.campus_runtime_school(uuid,text,jsonb,text,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.campus_runtime(
 runtime_connection uuid,runtime_operation text,runtime_commands jsonb DEFAULT '[]'::jsonb,
 ticket_hash text DEFAULT NULL,expected_campus uuid DEFAULT NULL,runtime_renew boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; occupants integer;
BEGIN
 result:=public.campus_runtime_school(runtime_connection,runtime_operation,runtime_commands,ticket_hash,expected_campus,runtime_renew);
 -- The underlying runtime retains the global room lock for this transaction.
 SELECT count(*) INTO occupants FROM campus_presence;
 IF occupants=0 OR (runtime_operation='connect' AND runtime_renew IS NOT TRUE AND result ? 'snapshot' AND occupants=1) THEN
  UPDATE campus_basketball SET state=public.campus_basketball_initial(),version=version+1
   WHERE room='library' AND state IS DISTINCT FROM public.campus_basketball_initial();
 END IF;
 IF NOT(result ? 'snapshot') THEN RETURN result; END IF;
 RETURN result||jsonb_build_object('world_revision','school-v2-basketball','game',public.campus_basketball_envelope());
END;
$$;
CREATE FUNCTION public.campus_basketball_commit(game_connection uuid,game_version bigint,game_state jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE own uuid; current_version bigint; current_state jsonb; candidate uuid; old_holder uuid; at_time timestamptz; flight_time double precision; travel double precision;
BEGIN
 PERFORM 1 FROM campus_runtime_lock WHERE room='library' FOR UPDATE;
 at_time:=clock_timestamp();
 SELECT campus_id INTO own FROM campus_presence WHERE connection_id=game_connection AND lease_until>at_time AND public.campus_allowed(campus_id);
 IF own IS NULL THEN RETURN jsonb_build_object('ended',true); END IF;
 SELECT version,state INTO current_version,current_state FROM campus_basketball WHERE room='library' FOR UPDATE;
 IF current_version IS DISTINCT FROM game_version THEN RETURN jsonb_build_object('applied',false,'game',public.campus_basketball_envelope()); END IF;
 IF jsonb_typeof(game_state) IS DISTINCT FROM 'object' OR jsonb_typeof(game_state->'x') IS DISTINCT FROM 'number'
  OR jsonb_typeof(game_state->'y') IS DISTINCT FROM 'number' OR jsonb_typeof(game_state->'z') IS DISTINCT FROM 'number'
  OR (game_state->>'x')::numeric NOT BETWEEN 41 AND 63 OR (game_state->>'z')::numeric NOT BETWEEN -10 AND 10
  OR (game_state->>'y')::numeric NOT BETWEEN .36 AND 13
  OR (game_state->>'at')::numeric>(extract(epoch FROM at_time)*1000) OR (game_state->>'at')::numeric<(current_state->>'at')::numeric THEN
  RAISE EXCEPTION 'Invalid court proposal';
 END IF;
 candidate:=nullif(game_state->>'holder','')::uuid;old_holder:=nullif(current_state->>'holder','')::uuid;
 IF old_holder IS NOT NULL AND candidate IS DISTINCT FROM old_holder AND old_holder<>own AND EXISTS(
  SELECT 1 FROM campus_presence WHERE campus_id=old_holder AND lease_until>at_time AND status='walking'
   AND x>42 AND x<62 AND z>-9 AND z<9 AND public.campus_allowed(campus_id)) THEN RAISE EXCEPTION 'Court ownership denied'; END IF;
 IF candidate IS NOT NULL AND NOT EXISTS(SELECT 1 FROM campus_presence WHERE campus_id=candidate AND lease_until>at_time
  AND status='walking' AND x>42 AND x<62 AND z>-9 AND z<9 AND public.campus_allowed(campus_id)) THEN
  RETURN jsonb_build_object('applied',false,'game',public.campus_basketball_envelope());
 END IF;
 IF candidate IS DISTINCT FROM old_holder AND candidate IS NOT NULL AND candidate<>own THEN RAISE EXCEPTION 'Court ownership denied'; END IF;
 -- The trusted service first advances physics from this version to database time.
 -- Its exact reach test uses that advanced position, while this conservative
 -- bound prevents a second, stale-position check from rejecting a falling catch.
 flight_time:=greatest(0,least(.5,((game_state->>'at')::double precision-(current_state->>'at')::double precision)/1000));
 travel:=sqrt((current_state->>'vx')::double precision^2+(current_state->>'vy')::double precision^2+(current_state->>'vz')::double precision^2)*flight_time+9.81*flight_time^2/2;
 IF candidate IS DISTINCT FROM old_holder AND candidate IS NOT NULL AND NOT EXISTS(SELECT 1 FROM campus_presence WHERE campus_id=own
  AND sqrt((x-(current_state->>'x')::double precision)^2+(z-(current_state->>'z')::double precision)^2)<=2.1+travel
  AND (current_state->>'y')::double precision<=2.3+travel) THEN RAISE EXCEPTION 'Court pickup denied'; END IF;
 UPDATE campus_basketball SET state=game_state,version=version+1 WHERE room='library';
 RETURN jsonb_build_object('applied',true,'game',public.campus_basketball_envelope());
END;
$$;
REVOKE ALL ON FUNCTION public.campus_basketball_initial(),public.campus_basketball_envelope() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean),public.campus_basketball_commit(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean),public.campus_basketball_commit(uuid,bigint,jsonb) TO service_role;
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) SET lock_timeout='2s';
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) SET statement_timeout='4s';
ALTER FUNCTION public.campus_basketball_commit(uuid,bigint,jsonb) SET lock_timeout='2s';
ALTER FUNCTION public.campus_basketball_commit(uuid,bigint,jsonb) SET statement_timeout='4s';
COMMIT;
