-- Approved local software phase. Hosted application requires environment-specific approval.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $guard$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.campus_game(uuid,text,text,jsonb)') AND md5(prosrc)='799024042d23ff9780e4f19227e4f3b2')
 OR NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.campus_runtime(uuid,text,jsonb,text,uuid,boolean)') AND md5(prosrc)='8adafe8c10039412724a99b3ab5eebbb')
 OR to_regprocedure('public.campus_play(uuid,text,jsonb,text,jsonb,text)') IS NOT NULL THEN
   RAISE EXCEPTION 'Expected reviewed 077 authority; stop and inspect migration state';
 END IF;
END; $guard$;
ALTER FUNCTION public.campus_game(uuid,text,text,jsonb) RENAME TO campus_game_unlocated;
REVOKE ALL ON FUNCTION public.campus_game_unlocated(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.campus_game_members ADD COLUMN connection text;
CREATE TABLE public.campus_play_invites(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender uuid NOT NULL REFERENCES public.campus_members(user_id) ON DELETE CASCADE,
 recipient uuid NOT NULL REFERENCES public.campus_members(user_id) ON DELETE CASCADE,
 sender_connection text NOT NULL,recipient_connection text NOT NULL,
 table_id text NOT NULL REFERENCES public.campus_game_tables(table_id),state text NOT NULL CHECK(state IN ('pending','accepted')),
 expires timestamptz NOT NULL,CHECK(sender<>recipient));
CREATE TABLE public.campus_play_limits(user_id uuid PRIMARY KEY REFERENCES public.campus_members(user_id) ON DELETE CASCADE,
 last_sent timestamptz NOT NULL DEFAULT '-infinity',connection text NOT NULL,muted boolean NOT NULL DEFAULT false);
CREATE TABLE public.campus_play_backoff(sender uuid NOT NULL REFERENCES public.campus_members(user_id) ON DELETE CASCADE,
 recipient uuid NOT NULL REFERENCES public.campus_members(user_id) ON DELETE CASCADE,until_at timestamptz NOT NULL,PRIMARY KEY(sender,recipient));
CREATE TABLE public.campus_play_keys(campus_id uuid PRIMARY KEY REFERENCES public.campus_members(campus_id) ON DELETE CASCADE,
 connection uuid UNIQUE NOT NULL,credential text NOT NULL CHECK(credential ~ '^[0-9a-f]{64}$'));
ALTER TABLE public.campus_play_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_play_keys FROM PUBLIC,anon,authenticated,service_role;
-- Bind HTTP game authority in the same transaction as admission and duration handover.
-- No connection IDs or new authentication fields are exposed in world messages.
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) RENAME TO campus_runtime_before_play;
REVOKE ALL ON FUNCTION public.campus_runtime_before_play(uuid,text,jsonb,text,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.campus_game_credential(ticket_hash text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT encode(sha256(convert_to(encode(sha256(convert_to('campus-games-http-v1:'||ticket_hash,'UTF8')),'hex'),'UTF8')),'hex');
$$;
REVOKE ALL ON FUNCTION public.campus_game_credential(text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.campus_runtime(runtime_connection uuid,runtime_operation text,runtime_commands jsonb DEFAULT '[]',
 ticket_hash text DEFAULT NULL,expected_campus uuid DEFAULT NULL,runtime_renew boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp SET lock_timeout='2s' SET statement_timeout='4s' AS $$
DECLARE result jsonb; old_connection uuid; own_user uuid;
BEGIN
 result=campus_runtime_before_play(runtime_connection,runtime_operation,runtime_commands,ticket_hash,expected_campus,runtime_renew);
 IF runtime_operation='connect' AND result ? 'snapshot' THEN
   -- The existing authority still holds the room lock. Requests cannot observe a half-handover.
   PERFORM pg_advisory_xact_lock(760076);
   SELECT connection INTO old_connection FROM campus_play_keys WHERE campus_id=expected_campus;
   SELECT user_id INTO own_user FROM campus_members WHERE campus_id=expected_campus;
   IF runtime_renew IS TRUE AND old_connection IS NOT NULL THEN
     UPDATE campus_game_members SET connection=runtime_connection::text WHERE user_id=own_user AND connection=old_connection::text;
     UPDATE campus_play_invites SET sender_connection=runtime_connection::text WHERE sender=own_user AND sender_connection=old_connection::text;
     UPDATE campus_play_invites SET recipient_connection=runtime_connection::text WHERE recipient=own_user AND recipient_connection=old_connection::text;
     UPDATE campus_play_limits SET connection=runtime_connection::text WHERE user_id=own_user AND connection=old_connection::text;
   END IF;
   INSERT INTO campus_play_keys VALUES(expected_campus,runtime_connection,campus_game_credential(ticket_hash))
    ON CONFLICT(campus_id) DO UPDATE SET connection=excluded.connection,credential=excluded.credential WHERE campus_play_keys.campus_id=expected_campus;
 END IF;
 IF runtime_operation='leave' OR EXISTS(SELECT 1 FROM campus_play_keys k WHERE NOT EXISTS(SELECT 1 FROM campus_presence p WHERE p.connection_id=k.connection AND p.lease_until>clock_timestamp())) THEN
   PERFORM campus_games_prepare(NULL,'vercel','{}');
 END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) TO service_role;
CREATE TABLE public.campus_play_context(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),last_at bigint NOT NULL DEFAULT 0);
INSERT INTO public.campus_play_context DEFAULT VALUES;
ALTER TABLE public.campus_play_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_play_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_play_backoff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_play_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_play_invites,public.campus_play_limits,public.campus_play_backoff,public.campus_play_context FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.campus_game_near(p jsonb,t text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT coalesce((p->>'floor')::integer=2 AND p->>'status'='walking' AND NOT (p->>'travel')::boolean AND p->>'seat' IS NULL
 AND (p->>'x')::float8>16 AND (p->>'x')::float8<36 AND (p->>'z')::float8>17 AND (p->>'z')::float8<35
 AND power((p->>'x')::float8-CASE t WHEN 'boxes' THEN 32.7 ELSE 20.7 END,2)
   +power((p->>'z')::float8-CASE t WHEN 'wortquest' THEN 21.3 ELSE 28.3 END,2)<2.4*2.4,false)
 AND t IN ('four','boxes','wortquest');
$$;
-- Called only inside protected request transactions. Lock order matches runtime: room, games.
CREATE FUNCTION public.campus_games_prepare(actor uuid,transport text,proof jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp SET lock_timeout='2s' AS $$
DECLARE live jsonb; stamp bigint; person uuid;
BEGIN
 IF transport='vercel' THEN
   PERFORM 1 FROM campus_runtime_lock WHERE room='library' FOR UPDATE;
   SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.campus_id,'connection',p.connection_id::text,'x',p.x,'z',p.z,
     'floor',p.floor,'status',p.status,'seat',p.seat,'travel',p.travel IS NOT NULL,'credential',k.credential)),'[]') INTO live
   FROM campus_presence p LEFT JOIN campus_play_keys k ON k.campus_id=p.campus_id AND k.connection=p.connection_id WHERE p.lease_until>clock_timestamp() AND campus_allowed(p.campus_id);
 ELSIF transport='colyseus' THEN
   IF jsonb_typeof(proof) IS DISTINCT FROM 'object' OR jsonb_typeof(proof->'players') IS DISTINCT FROM 'array'
     OR jsonb_array_length(proof->'players')>10 OR coalesce(proof->>'at','') !~ '^[0-9]{13}$' THEN RAISE EXCEPTION 'Live room unavailable'; END IF;
   stamp=(proof->>'at')::bigint;
   IF abs(extract(epoch FROM clock_timestamp())*1000-stamp)>2000 THEN RAISE EXCEPTION 'Live room context expired'; END IF;
   live=proof->'players';
   IF EXISTS(SELECT 1 FROM jsonb_array_elements(live) p WHERE
     coalesce(p->>'id','') !~ '^[0-9a-f-]{36}$' OR coalesce(p->>'connection','') !~ '^[A-Za-z0-9_-]{8,64}$'
     OR jsonb_typeof(p->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(p->'z') IS DISTINCT FROM 'number'
     OR coalesce(p->>'floor','') NOT IN ('0','1','2') OR coalesce(p->>'status','') NOT IN ('walking','seated','studying')
     OR jsonb_typeof(p->'travel') IS DISTINCT FROM 'boolean')
     OR (SELECT count(DISTINCT p->>'id') FROM jsonb_array_elements(live) p)<>jsonb_array_length(live) THEN RAISE EXCEPTION 'Invalid room context'; END IF;
   SELECT coalesce(jsonb_agg(p),'[]') INTO live FROM jsonb_array_elements(live) p WHERE campus_allowed((p->>'id')::uuid);
 ELSE RAISE EXCEPTION 'Live room unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(760076);
 IF transport='colyseus' THEN
   IF stamp<(SELECT last_at FROM campus_play_context WHERE singleton) THEN RAISE EXCEPTION 'Superseded room context'; END IF;
   UPDATE campus_play_context SET last_at=stamp WHERE singleton;
 END IF;
 DELETE FROM campus_play_invites i WHERE EXISTS(SELECT 1 FROM campus_game_members m WHERE m.user_id IN (i.sender,i.recipient)
   AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(live) p JOIN campus_members c ON c.campus_id=(p->>'id')::uuid
     WHERE c.user_id=m.user_id AND p->>'connection'=m.connection AND campus_game_near(p,m.table_id)));
 DELETE FROM campus_game_members m WHERE m.lease_until<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(live) p JOIN campus_members c ON c.campus_id=(p->>'id')::uuid
   WHERE c.user_id=m.user_id AND p->>'connection'=m.connection AND campus_game_near(p,m.table_id));
 DELETE FROM campus_play_invites i WHERE i.expires<=clock_timestamp()
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(live) p JOIN campus_members c ON c.campus_id=(p->>'id')::uuid WHERE c.user_id=i.sender AND p->>'connection'=i.sender_connection AND p->>'status'='walking' AND p->>'seat' IS NULL AND (i.state='accepted' OR NOT (p->>'travel')::boolean))
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(live) p JOIN campus_members c ON c.campus_id=(p->>'id')::uuid WHERE c.user_id=i.recipient AND p->>'connection'=i.recipient_connection AND p->>'status'='walking' AND p->>'seat' IS NULL AND (i.state='accepted' OR NOT (p->>'travel')::boolean))
   OR EXISTS(SELECT 1 FROM campus_blocks b JOIN campus_members s ON s.user_id=i.sender JOIN campus_members r ON r.user_id=i.recipient
      WHERE (b.owner_id=i.sender AND b.target=r.campus_id) OR (b.owner_id=i.recipient AND b.target=s.campus_id));
 DELETE FROM campus_play_keys k WHERE NOT EXISTS(SELECT 1 FROM campus_presence p WHERE p.campus_id=k.campus_id AND p.connection_id=k.connection AND p.lease_until>clock_timestamp());
 UPDATE campus_play_limits l SET muted=false,connection='' WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(live) p JOIN campus_members c ON c.campus_id=(p->>'id')::uuid WHERE c.user_id=l.user_id AND p->>'connection'=l.connection);
 DELETE FROM campus_play_limits WHERE connection='' AND last_sent<=clock_timestamp()-interval '10 seconds';
 DELETE FROM campus_play_backoff WHERE until_at<=clock_timestamp();
 UPDATE campus_game_tables g SET state=jsonb_set(g.state,'{phase}','"abandoned"'),version=g.version+1
 WHERE g.table_id IN ('four','boxes','wortquest') AND g.state->>'phase'='playing'
 AND (SELECT count(*) FROM campus_game_members m WHERE m.table_id=g.table_id)<>jsonb_array_length(g.state->'players');
 UPDATE campus_game_tables g SET state=NULL,quiz_level='A1',round=gen_random_uuid(),version=g.version+1
 WHERE g.table_id IN ('four','boxes','wortquest') AND (g.state IS NOT NULL OR g.quiz_level<>'A1') AND NOT EXISTS(SELECT 1 FROM campus_game_members m WHERE m.table_id=g.table_id);
 SELECT campus_id INTO person FROM campus_members WHERE user_id=actor;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(live) p WHERE p->>'id'=person::text) THEN RETURN NULL; END IF;
 RETURN live;
END; $$;
CREATE FUNCTION public.campus_game(actor uuid,game_table text,operation text,payload jsonb DEFAULT '{}',transport text DEFAULT '',proof jsonb DEFAULT '{}',credential text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp SET lock_timeout='2s' AS $$
DECLARE live jsonb; own jsonb; result jsonb; occupied integer;
BEGIN
 live=campus_games_prepare(actor,transport,proof);
 SELECT p INTO own FROM jsonb_array_elements(live) p JOIN campus_members c ON c.campus_id=(p->>'id')::uuid WHERE c.user_id=actor;
 IF own IS NULL OR credential IS NULL OR credential !~ '^[0-9a-f]{64}$' OR own->>'credential' IS DISTINCT FROM credential THEN RETURN jsonb_build_object('error','Use the connected school tab to play'); END IF;
 -- Leave remains possible from any location. It never exposes another player's roster.
 IF operation='leave' THEN
   IF payload ? 'member' AND payload->>'member' IS DISTINCT FROM (SELECT player_id::text FROM campus_game_members WHERE user_id=actor AND table_id=game_table) THEN RETURN jsonb_build_object('table',game_table,'members','[]'::jsonb,'self',NULL,'count',0); END IF;
   DELETE FROM campus_play_invites WHERE sender=actor OR recipient=actor;
   IF EXISTS(SELECT 1 FROM campus_game_members WHERE user_id=actor AND table_id=game_table) THEN
     PERFORM campus_game_unlocated(actor,game_table,'leave','{}');
   END IF;
   RETURN jsonb_build_object('table',game_table,'members','[]'::jsonb,'self',NULL,'count',0);
 END IF;
 IF live IS NULL OR NOT campus_game_near(own,game_table) THEN RETURN jsonb_build_object('error','Walk to this table in the Level 2 Games Lounge first'); END IF;
 IF (operation='commit' AND payload->>'start'='true') OR operation='quiz-start' THEN
   IF EXISTS(SELECT 1 FROM campus_play_invites WHERE state='accepted' AND table_id=game_table) THEN RETURN jsonb_build_object('error','Wait for reserved players to join or cancel the invitation'); END IF;
 END IF;
 IF operation='join' THEN
   IF EXISTS(SELECT 1 FROM campus_play_invites WHERE state='accepted' AND (sender=actor OR recipient=actor) AND table_id<>game_table) THEN RETURN jsonb_build_object('error','Cancel your other table reservation first'); END IF;
   IF EXISTS(SELECT 1 FROM campus_play_invites i JOIN campus_members c ON c.user_id IN (i.sender,i.recipient)
     JOIN campus_blocks b ON (b.owner_id=actor AND b.target=c.campus_id) OR (b.owner_id=c.user_id AND b.target=(SELECT campus_id FROM campus_members WHERE user_id=actor))
     WHERE i.state='accepted' AND i.table_id=game_table) THEN RETURN jsonb_build_object('error','This table is unavailable'); END IF;
   SELECT count(DISTINCT u) INTO occupied FROM (
     SELECT user_id u FROM campus_game_members WHERE table_id=game_table
     UNION SELECT sender FROM campus_play_invites WHERE table_id=game_table AND state='accepted'
     UNION SELECT recipient FROM campus_play_invites WHERE table_id=game_table AND state='accepted') q WHERE u<>actor;
   IF occupied>=(CASE WHEN game_table='four' THEN 2 ELSE 4 END) THEN RETURN jsonb_build_object('error','This table is full or reserved'); END IF;
 END IF;
 result=campus_game_unlocated(actor,game_table,operation,payload);
 IF operation='join' AND NOT result ? 'error' THEN
   UPDATE campus_game_members SET connection=own->>'connection' WHERE user_id=actor;
   DELETE FROM campus_play_invites i WHERE i.state='accepted' AND i.table_id=game_table
     AND EXISTS(SELECT 1 FROM campus_game_members WHERE user_id=i.sender AND table_id=game_table)
     AND EXISTS(SELECT 1 FROM campus_game_members WHERE user_id=i.recipient AND table_id=game_table);
 END IF;
 RETURN result;
END; $$;

CREATE FUNCTION public.campus_play(actor uuid,operation text,payload jsonb DEFAULT '{}',transport text DEFAULT '',proof jsonb DEFAULT '{}',credential text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp SET lock_timeout='2s' AS $$
DECLARE live jsonb; own jsonb; peer jsonb; person campus_members; other campus_members; invite campus_play_invites; n integer; card jsonb; nearby jsonb;
BEGIN
 IF operation NOT IN ('read','send','accept','decline','cancel','mute') OR jsonb_typeof(payload) IS DISTINCT FROM 'object' OR octet_length(payload::text)>512 THEN RETURN jsonb_build_object('error','Invalid invitation'); END IF;
 live=campus_games_prepare(actor,transport,proof);
 SELECT * INTO person FROM campus_members WHERE user_id=actor;
 SELECT p INTO own FROM jsonb_array_elements(live) p WHERE p->>'id'=person.campus_id::text;
 IF live IS NULL OR own IS NULL OR credential IS NULL OR credential !~ '^[0-9a-f]{64}$' OR own->>'credential' IS DISTINCT FROM credential THEN RETURN jsonb_build_object('error','Enter the school first'); END IF;
 IF operation='mute' THEN
   IF jsonb_typeof(payload->'muted') IS DISTINCT FROM 'boolean' THEN RETURN jsonb_build_object('error','Invalid preference'); END IF;
   INSERT INTO campus_play_limits(user_id,connection,muted) VALUES(actor,own->>'connection',(payload->>'muted')::boolean)
   ON CONFLICT(user_id) DO UPDATE SET muted=excluded.muted,connection=excluded.connection WHERE campus_play_limits.user_id=actor;
   IF (payload->>'muted')::boolean THEN DELETE FROM campus_play_invites WHERE recipient=actor AND state='pending'; END IF;
 ELSIF operation='send' THEN
   IF coalesce(payload->>'table','') NOT IN ('four','boxes','wortquest') OR coalesce(payload->>'target','') !~ '^[0-9a-f-]{36}$' THEN RETURN jsonb_build_object('error','Choose a nearby player and game'); END IF;
   SELECT * INTO other FROM campus_members WHERE campus_id=(payload->>'target')::uuid;
   SELECT p INTO peer FROM jsonb_array_elements(live) p WHERE p->>'id'=other.campus_id::text;
   IF other.user_id IS NULL OR other.user_id=actor OR peer IS NULL OR own->>'status'<>'walking' OR peer->>'status'<>'walking'
    OR (own->>'travel')::boolean OR (peer->>'travel')::boolean OR own->>'seat' IS NOT NULL OR peer->>'seat' IS NOT NULL
    OR own->>'floor'<>peer->>'floor' OR power((own->>'x')::float8-(peer->>'x')::float8,2)+power((own->>'z')::float8-(peer->>'z')::float8,2)>25
    OR EXISTS(SELECT 1 FROM campus_blocks WHERE (owner_id=actor AND target=other.campus_id) OR (owner_id=other.user_id AND target=person.campus_id))
    OR EXISTS(SELECT 1 FROM campus_play_limits WHERE user_id=other.user_id AND muted)
    OR EXISTS(SELECT 1 FROM campus_game_members WHERE user_id IN (actor,other.user_id)) THEN RETURN jsonb_build_object('error','This player is unavailable for an invitation'); END IF;
   IF EXISTS(SELECT 1 FROM campus_play_invites WHERE sender IN (actor,other.user_id) OR recipient IN (actor,other.user_id)) THEN RETURN jsonb_build_object('error','Finish or cancel the current invitation first'); END IF;
   IF EXISTS(SELECT 1 FROM campus_play_limits WHERE user_id=actor AND last_sent>clock_timestamp()-interval '10 seconds')
     OR EXISTS(SELECT 1 FROM campus_play_backoff WHERE sender=actor AND recipient=other.user_id) THEN RETURN jsonb_build_object('error','Please wait before inviting again'); END IF;
   INSERT INTO campus_play_limits(user_id,connection,last_sent) VALUES(actor,own->>'connection',clock_timestamp())
     ON CONFLICT(user_id) DO UPDATE SET last_sent=excluded.last_sent,connection=excluded.connection WHERE campus_play_limits.user_id=actor;
   INSERT INTO campus_play_invites(sender,recipient,sender_connection,recipient_connection,table_id,state,expires)
     VALUES(actor,other.user_id,own->>'connection',peer->>'connection',payload->>'table','pending',clock_timestamp()+interval '30 seconds');
 ELSIF operation IN ('accept','decline','cancel') THEN
   IF coalesce(payload->>'id','') !~ '^[0-9a-f-]{36}$' THEN RETURN jsonb_build_object('error','Invitation expired'); END IF;
   SELECT * INTO invite FROM campus_play_invites WHERE id=(payload->>'id')::uuid AND (sender=actor OR recipient=actor);
   IF NOT FOUND OR (operation IN ('accept','decline') AND (invite.recipient<>actor OR invite.state<>'pending')) THEN RETURN jsonb_build_object('error','Invitation expired or already answered'); END IF;
   IF operation='accept' THEN
     IF EXISTS(SELECT 1 FROM jsonb_array_elements(live) p WHERE p->>'id' IN (SELECT campus_id::text FROM campus_members WHERE user_id IN (invite.sender,invite.recipient)) AND ((p->>'travel')::boolean OR p->>'status'<>'walking')) THEN RETURN jsonb_build_object('error','Stand in the school before accepting'); END IF;
     SELECT count(DISTINCT u) INTO n FROM (
       SELECT user_id u FROM campus_game_members WHERE table_id=invite.table_id
       UNION SELECT sender FROM campus_play_invites WHERE state='accepted' AND table_id=invite.table_id
       UNION SELECT recipient FROM campus_play_invites WHERE state='accepted' AND table_id=invite.table_id
       UNION SELECT invite.sender UNION SELECT invite.recipient) q;
     IF EXISTS(SELECT 1 FROM campus_blocks b JOIN campus_members a ON a.user_id IN (invite.sender,invite.recipient)
       JOIN campus_members c ON c.user_id IN (SELECT user_id FROM campus_game_members WHERE table_id=invite.table_id
         UNION SELECT sender FROM campus_play_invites WHERE table_id=invite.table_id AND state='accepted'
         UNION SELECT recipient FROM campus_play_invites WHERE table_id=invite.table_id AND state='accepted')
       WHERE (b.owner_id=a.user_id AND b.target=c.campus_id) OR (b.owner_id=c.user_id AND b.target=a.campus_id)) THEN RETURN jsonb_build_object('error','This table is unavailable'); END IF;
     IF n>(CASE WHEN invite.table_id='four' THEN 2 ELSE 4 END) OR EXISTS(SELECT 1 FROM campus_game_tables WHERE table_id=invite.table_id AND state->>'phase'='playing') THEN RETURN jsonb_build_object('error','This table is busy. Try another game'); END IF;
     UPDATE campus_play_invites SET state='accepted',expires=clock_timestamp()+interval '2 minutes' WHERE id=invite.id;
   ELSE
     IF operation='decline' THEN
       INSERT INTO campus_play_backoff VALUES(invite.sender,invite.recipient,clock_timestamp()+interval '60 seconds') ON CONFLICT(sender,recipient) DO UPDATE SET until_at=excluded.until_at WHERE campus_play_backoff.sender=invite.sender AND campus_play_backoff.recipient=invite.recipient;
     END IF;
     DELETE FROM campus_play_invites WHERE id=invite.id;
     IF invite.state='accepted' THEN
       PERFORM campus_game_unlocated(invite.sender,invite.table_id,'leave','{}');
       PERFORM campus_game_unlocated(invite.recipient,invite.table_id,'leave','{}');
     END IF;
   END IF;
 END IF;
 SELECT * INTO invite FROM campus_play_invites WHERE sender=actor OR recipient=actor;
 IF FOUND THEN
   SELECT * INTO other FROM campus_members WHERE user_id=CASE WHEN invite.sender=actor THEN invite.recipient ELSE invite.sender END;
   card=jsonb_build_object('id',invite.id,'table',invite.table_id,'state',invite.state,'incoming',invite.recipient=actor,'peer',other.campus_id,'pseudonym',other.pseudonym,'expires',invite.expires);
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.campus_id,'pseudonym',c.pseudonym)),'[]') INTO nearby
 FROM jsonb_array_elements(live) p JOIN campus_members c ON c.campus_id=(p->>'id')::uuid
 WHERE c.user_id<>actor AND own->>'status'='walking' AND p->>'status'='walking' AND NOT (own->>'travel')::boolean AND NOT (p->>'travel')::boolean
 AND own->>'floor'=p->>'floor' AND power((own->>'x')::float8-(p->>'x')::float8,2)+power((own->>'z')::float8-(p->>'z')::float8,2)<=25
 AND NOT EXISTS(SELECT 1 FROM campus_game_members WHERE user_id=c.user_id)
 AND NOT EXISTS(SELECT 1 FROM campus_play_limits WHERE user_id=c.user_id AND muted)
 AND NOT EXISTS(SELECT 1 FROM campus_play_invites WHERE sender=c.user_id OR recipient=c.user_id)
 AND NOT EXISTS(SELECT 1 FROM campus_blocks WHERE (owner_id=actor AND target=c.campus_id) OR (owner_id=c.user_id AND target=person.campus_id));
 RETURN jsonb_build_object('invitation',card,'nearby',nearby);
END; $$;
CREATE FUNCTION public.campus_play_depart(target uuid,owner_connection text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp SET lock_timeout='2s' AS $$
DECLARE actor uuid;
BEGIN
 IF owner_connection IS NULL OR owner_connection !~ '^[A-Za-z0-9_-]{8,64}$' THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(760076);
 SELECT user_id INTO actor FROM campus_members WHERE campus_id=target;
 DELETE FROM campus_play_invites WHERE (sender=actor AND sender_connection=owner_connection) OR (recipient=actor AND recipient_connection=owner_connection);
 DELETE FROM campus_game_members WHERE user_id=actor AND connection=owner_connection;
 UPDATE campus_play_limits SET connection='',muted=false WHERE user_id=actor AND connection=owner_connection;
 -- Reuse the preserved roster-loss/empty-table cleanup, discarding its projection.
 PERFORM campus_game_unlocated(NULL,'four','read','{}');
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.campus_play_depart(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_play_depart(uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.campus_game_near(jsonb,text),public.campus_games_prepare(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.campus_game(uuid,text,text,jsonb,text,jsonb,text),public.campus_play(uuid,text,jsonb,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_game(uuid,text,text,jsonb,text,jsonb,text),public.campus_play(uuid,text,jsonb,text,jsonb,text) TO service_role;
-- Extend existing switch cleanup, retaining its exact game reset behavior.
CREATE OR REPLACE FUNCTION public.campus_games_switch_cleanup() RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF (TG_OP='DELETE' AND OLD.key='virtual_campus_enabled') OR (TG_OP='UPDATE' AND NEW.key='virtual_campus_enabled' AND NOT coalesce(NEW.enabled,false)) THEN
   DELETE FROM campus_play_invites WHERE state IN ('pending','accepted');
   DELETE FROM campus_play_keys WHERE connection IS NOT NULL;
   DELETE FROM campus_play_limits WHERE connection IS NOT NULL;
   DELETE FROM campus_play_backoff WHERE sender IS NOT NULL;
   DELETE FROM campus_game_members WHERE table_id IN ('four','boxes','wortquest');
   UPDATE campus_game_tables SET state=NULL,quiz_level='A1',round=gen_random_uuid(),version=version+1 WHERE table_id IN ('four','boxes','wortquest');
 END IF;
 RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.campus_games_switch_cleanup() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
