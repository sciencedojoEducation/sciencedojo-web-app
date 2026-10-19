-- Owner-approved Games Lounge software; hosted application requires separate approval.
BEGIN;
CREATE TABLE public.campus_game_tables (
 table_id text PRIMARY KEY CHECK(table_id IN ('four','boxes')),
 round uuid NOT NULL DEFAULT gen_random_uuid(), version bigint NOT NULL DEFAULT 0,
 state jsonb CHECK(state IS NULL OR (jsonb_typeof(state)='object' AND octet_length(state::text)<12000))
);
INSERT INTO public.campus_game_tables(table_id) VALUES('four'),('boxes');
CREATE TABLE public.campus_game_members (
 user_id uuid PRIMARY KEY REFERENCES public.campus_members(user_id) ON DELETE CASCADE,
 table_id text NOT NULL REFERENCES public.campus_game_tables(table_id),
 player_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
 username text NOT NULL CHECK(length(username) BETWEEN 1 AND 24),
 ready boolean NOT NULL DEFAULT false, joined_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 lease_until timestamptz NOT NULL DEFAULT clock_timestamp()+interval '45 seconds',
 last_action timestamptz NOT NULL DEFAULT '-infinity'
);
ALTER TABLE public.campus_game_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_game_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_game_tables,public.campus_game_members FROM PUBLIC,anon,authenticated,service_role;

-- Only the trusted application may call this function; its actor is the verified session user.
-- One global lock also serializes two-table transfers, cleanup and block filtering.
CREATE FUNCTION public.campus_game(actor uuid, game_table text, operation text, payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp SET lock_timeout='2s' AS $$
DECLARE t campus_game_tables; own campus_game_members; person campus_members;
 n integer; changed integer; roster jsonb; ids jsonb; state_next jsonb;
BEGIN
 IF game_table NOT IN ('four','boxes') OR operation NOT IN ('read','join','ready','commit','leave','photo','target')
 OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>16000 THEN
   RETURN jsonb_build_object('error','Invalid game request');
 END IF;
 PERFORM pg_advisory_xact_lock(760076);
 DELETE FROM campus_game_members m WHERE m.lease_until<clock_timestamp()
 OR NOT EXISTS(SELECT 1 FROM campus_members c WHERE c.user_id=m.user_id AND public.campus_allowed(c.campus_id))
 OR EXISTS(SELECT 1 FROM campus_game_members other_m
   JOIN campus_members a ON a.user_id=m.user_id JOIN campus_members b ON b.user_id=other_m.user_id
   JOIN campus_blocks bl ON (bl.owner_id=a.user_id AND bl.target=b.campus_id) OR (bl.owner_id=b.user_id AND bl.target=a.campus_id)
   WHERE other_m.table_id=m.table_id AND other_m.user_id<>m.user_id);
 GET DIAGNOSTICS changed=ROW_COUNT;
 -- Account deletion/leave/expiry changes the frozen roster: never infer a win.
 UPDATE campus_game_tables g SET state=jsonb_set(g.state,'{phase}','"abandoned"'),version=g.version+1
 WHERE g.table_id IN ('four','boxes') AND g.state->>'phase'='playing'
 AND (SELECT count(*) FROM campus_game_members m WHERE m.table_id=g.table_id)<>jsonb_array_length(g.state->'players');
 UPDATE campus_game_tables g SET state=NULL,round=gen_random_uuid(),version=g.version+1
 WHERE g.table_id IN ('four','boxes') AND g.state IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM campus_game_members m WHERE m.table_id=g.table_id);
 SELECT * INTO person FROM campus_members WHERE user_id=actor;
 IF NOT FOUND OR NOT public.campus_allowed(person.campus_id) THEN
   RETURN jsonb_build_object('error','Campus access required');
 END IF;
 SELECT * INTO t FROM campus_game_tables WHERE table_id=game_table FOR UPDATE;
 SELECT * INTO own FROM campus_game_members WHERE user_id=actor;
 IF operation='join' THEN
   IF own.user_id IS NOT NULL AND own.table_id<>game_table THEN RETURN jsonb_build_object('error','Leave your other table first'); END IF;
   IF own.user_id IS NULL THEN
     IF t.state->>'phase'='playing' THEN RETURN jsonb_build_object('error','A round is already in progress'); END IF;
     SELECT count(*) INTO n FROM campus_game_members WHERE table_id=game_table;
     IF n >= (CASE WHEN game_table='four' THEN 2 ELSE 4 END) THEN RETURN jsonb_build_object('error','This table is full'); END IF;
     IF EXISTS(SELECT 1 FROM campus_game_members m JOIN campus_members c ON c.user_id=m.user_id
       JOIN campus_blocks b ON (b.owner_id=actor AND b.target=c.campus_id) OR (b.owner_id=m.user_id AND b.target=person.campus_id)
       WHERE m.table_id=game_table) THEN RETURN jsonb_build_object('error','This table is unavailable'); END IF;
     IF coalesce(payload->>'username','') !~ '^[[:alnum:]][[:alnum:] _.\-]{0,23}$' THEN RETURN jsonb_build_object('error','Choose a username of 1–24 letters, numbers, spaces, dots, dashes or underscores'); END IF;
     IF EXISTS(SELECT 1 FROM campus_game_members m WHERE m.table_id=game_table AND lower(m.username)=lower(payload->>'username')) THEN RETURN jsonb_build_object('error','Choose a different username at this table'); END IF;
     INSERT INTO campus_game_members(user_id,table_id,username) VALUES(actor,game_table,payload->>'username') RETURNING * INTO own;
     UPDATE campus_game_members SET ready=false WHERE table_id=game_table;
     UPDATE campus_game_tables SET state=NULL,round=gen_random_uuid(),version=version+1 WHERE table_id=game_table RETURNING * INTO t;
   END IF;
 END IF;
 IF operation IN ('ready','commit','leave','photo','target') AND (own.user_id IS NULL OR own.table_id<>game_table) THEN
   RETURN jsonb_build_object('error','Join this table first');
 END IF;
 IF own.table_id=game_table THEN
   UPDATE campus_game_members SET lease_until=clock_timestamp()+interval '45 seconds' WHERE user_id=actor;
 END IF;
 IF operation IN ('ready','commit') THEN
   IF own.last_action>clock_timestamp()-interval '150 milliseconds' THEN RETURN jsonb_build_object('error','Please wait a moment'); END IF;
   IF payload->>'round' IS DISTINCT FROM t.round::text OR (operation='commit' AND payload->>'version' IS DISTINCT FROM t.version::text) THEN RETURN jsonb_build_object('error','The table changed. Try again.'); END IF;
   UPDATE campus_game_members SET last_action=clock_timestamp() WHERE user_id=actor;
 END IF;
 IF operation='ready' THEN
   IF t.state->>'phase'='playing' THEN RETURN jsonb_build_object('error','The round is in progress'); END IF;
   IF jsonb_typeof(payload->'ready') IS DISTINCT FROM 'boolean' THEN RETURN jsonb_build_object('error','Invalid ready state'); END IF;
   UPDATE campus_game_members SET ready=(payload->>'ready')::boolean WHERE user_id=actor;
   UPDATE campus_game_tables SET version=version+1 WHERE table_id=game_table RETURNING * INTO t;
 ELSIF operation='commit' THEN
   state_next=payload->'state';
   SELECT jsonb_agg(m.player_id::text ORDER BY m.joined_at,m.player_id),count(*) INTO ids,n FROM campus_game_members m WHERE m.table_id=game_table;
   IF state_next->'players' IS DISTINCT FROM ids OR state_next->>'kind' IS DISTINCT FROM game_table
      OR state_next IS NULL OR coalesce(state_next->>'phase','') NOT IN ('playing','finished') THEN RETURN jsonb_build_object('error','Invalid board'); END IF;
   IF payload->>'start'='true' THEN
     IF t.state->>'phase'='playing' OR n<2 OR EXISTS(SELECT 1 FROM campus_game_members m WHERE m.table_id=game_table AND NOT ready) THEN RETURN jsonb_build_object('error','Wait for every player to be ready'); END IF;
     UPDATE campus_game_members SET ready=false WHERE table_id=game_table;
     UPDATE campus_game_tables SET state=state_next,round=gen_random_uuid(),version=version+1 WHERE table_id=game_table RETURNING * INTO t;
   ELSE
     IF t.state->>'phase' IS DISTINCT FROM 'playing' OR t.state->'players'->>((t.state->>'turn')::integer) IS DISTINCT FROM own.player_id::text THEN RETURN jsonb_build_object('error','Wait for your turn'); END IF;
     UPDATE campus_game_tables SET state=state_next,version=version+1 WHERE table_id=game_table RETURNING * INTO t;
   END IF;
 ELSIF operation='leave' THEN
   DELETE FROM campus_game_members WHERE user_id=actor;
   UPDATE campus_game_members SET ready=false WHERE table_id=game_table;
   UPDATE campus_game_tables SET state=CASE WHEN state IS NULL THEN NULL ELSE jsonb_set(state,'{phase}','"abandoned"') END,version=version+1 WHERE table_id=game_table RETURNING * INTO t;
   own=NULL;
   IF NOT EXISTS(SELECT 1 FROM campus_game_members m WHERE m.table_id=game_table) THEN
     UPDATE campus_game_tables SET state=NULL,round=gen_random_uuid(),version=version+1 WHERE table_id=game_table RETURNING * INTO t;
   END IF;
 ELSIF operation IN ('photo','target') THEN
   IF operation='photo' AND payload->>'player'='self' THEN RETURN jsonb_build_object('photo',(SELECT avatar_url FROM profiles WHERE id=actor)); END IF;
   IF NOT EXISTS(SELECT 1 FROM campus_game_members m WHERE m.table_id=game_table AND m.player_id::text=payload->>'player') THEN RETURN jsonb_build_object('error','Player unavailable'); END IF;
   IF operation='photo' THEN RETURN jsonb_build_object('photo',(SELECT p.avatar_url FROM campus_game_members m JOIN profiles p ON p.id=m.user_id WHERE m.player_id::text=payload->>'player')); END IF;
   RETURN jsonb_build_object('target',(SELECT c.campus_id FROM campus_game_members m JOIN campus_members c ON c.user_id=m.user_id WHERE m.player_id::text=payload->>'player' AND m.user_id<>actor));
 END IF;
 IF own.user_id IS NOT NULL AND own.table_id=game_table THEN
   SELECT coalesce(jsonb_agg(jsonb_build_object('id',m.player_id,'username',m.username,'ready',m.ready,'photo',coalesce(p.avatar_url,'')<>'') ORDER BY m.joined_at,m.player_id),'[]'::jsonb)
   INTO roster FROM campus_game_members m JOIN profiles p ON p.id=m.user_id WHERE m.table_id=game_table;
 ELSE roster='[]'::jsonb; END IF;
 SELECT count(*) INTO n FROM campus_game_members WHERE table_id=game_table;
 RETURN jsonb_build_object('table',game_table,'round',t.round,'version',t.version,'self',CASE WHEN own.table_id=game_table THEN own.player_id ELSE NULL END,
   'count',n,'members',roster,'state',CASE WHEN own.table_id=game_table THEN t.state ELSE NULL END);
END; $$;
REVOKE ALL ON FUNCTION public.campus_game(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_game(uuid,text,text,jsonb) TO service_role;
COMMIT;
