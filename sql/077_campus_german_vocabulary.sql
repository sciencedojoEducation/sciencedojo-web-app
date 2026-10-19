-- WortQuest software phase; hosted application requires a separate reviewed approval.
BEGIN;
ALTER TABLE public.campus_game_tables DROP CONSTRAINT campus_game_tables_table_id_check;
ALTER TABLE public.campus_game_tables ADD CONSTRAINT campus_game_tables_table_id_check CHECK(table_id IN ('four','boxes','wortquest'));
ALTER TABLE public.campus_game_tables ADD COLUMN quiz_level text NOT NULL DEFAULT 'A1' CHECK(quiz_level IN ('A1','A2','B1','B2','C1','C2'));
INSERT INTO public.campus_game_tables(table_id) VALUES('wortquest');
-- Private helpers: callable only through the checked SECURITY DEFINER game RPC.
CREATE FUNCTION public.campus_quiz_update(s jsonb, player text, op text, p jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE i integer; q jsonb; answers jsonb; chosen integer; scores jsonb;
BEGIN
 IF s IS NULL OR NOT (s->'players' ? player) THEN RETURN jsonb_build_object('error','Start a quiz first'); END IF;
 i=(s->>'index')::integer; q=s->'questions'->i;
 IF p->>'card' IS DISTINCT FROM q->>'id' THEN RETURN jsonb_build_object('error','That card has changed'); END IF;
 IF op='quiz-answer' AND s->>'phase' IN ('playing','finished') AND s->'answers'->i ? player THEN RETURN s; END IF;
 IF s->>'phase' IS DISTINCT FROM 'playing' THEN RETURN jsonb_build_object('error','Start a quiz first'); END IF;
 IF op='quiz-answer' THEN
   IF s->>'stage'<>'answering' THEN RETURN jsonb_build_object('error','This card is closed'); END IF;
   IF jsonb_typeof(p->'choice') IS DISTINCT FROM 'number' OR (p->>'choice') !~ '^-?[0-9]$' THEN RETURN jsonb_build_object('error','Choose an explanation or Skip'); END IF;
   chosen=(p->>'choice')::integer;
   IF chosen < -1 OR chosen > 3 THEN RETURN jsonb_build_object('error','Choose an explanation or Skip'); END IF;
   answers=(s->'answers'->i)||jsonb_build_object(player,chosen);
   s=jsonb_set(s,ARRAY['answers',i::text],answers);
   IF (SELECT count(*) FROM jsonb_object_keys(answers))=jsonb_array_length(s->'players') THEN
     SELECT jsonb_agg((s->'scores'->>(ordinality-1)::integer)::integer + CASE WHEN (answers->>value)::integer=(q->>'correct')::integer THEN 10 ELSE 0 END ORDER BY ordinality)
     INTO scores FROM jsonb_array_elements_text(s->'players') WITH ORDINALITY;
     s=jsonb_set(jsonb_set(s,'{scores}',scores),'{stage}','"reveal"');
     IF i=9 THEN s=jsonb_set(s,'{phase}','"finished"'); END IF;
   END IF;
 ELSIF op='quiz-next' THEN
   IF s->>'stage'<>'reveal' THEN RETURN jsonb_build_object('error','Wait for everyone to answer'); END IF;
   IF NOT (s->'continued' ? player) THEN s=jsonb_set(s,'{continued}',(s->'continued')||jsonb_build_array(player)); END IF;
   IF jsonb_array_length(s->'continued')=jsonb_array_length(s->'players') THEN
     s=jsonb_set(jsonb_set(jsonb_set(s,'{index}',to_jsonb(i+1)),'{stage}','"answering"'),'{continued}','[]');
   END IF;
 ELSE RETURN jsonb_build_object('error','Invalid quiz action'); END IF;
 RETURN s;
END; $$;
CREATE FUNCTION public.campus_quiz_view(s jsonb, viewer text, level text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE i integer; q jsonb; result jsonb; review jsonb; winners jsonb;
BEGIN
 IF s IS NULL THEN RETURN NULL; END IF;
 i=(s->>'index')::integer; q=s->'questions'->i;
 SELECT coalesce(jsonb_agg(ordinality-1),'[]') INTO winners
 FROM jsonb_array_elements_text(s->'scores') WITH ORDINALITY
 WHERE value::integer=(SELECT max(value::integer) FROM jsonb_array_elements_text(s->'scores'));
 result=jsonb_build_object('level',level,'phase',s->'phase','stage',s->'stage','index',i,'total',10,
  'question',q-'correct'-'translation','answered',s->'answers'->i ? viewer,
  'submitted',(SELECT count(*) FROM jsonb_object_keys(s->'answers'->i)),
  'continued',s->'continued' ? viewer,'scores',s->'scores',
  'winners',CASE WHEN s->>'phase'='finished' THEN winners ELSE '[]'::jsonb END,'review','[]'::jsonb);
 IF s->>'stage'='reveal' THEN result=result||jsonb_build_object('solution',jsonb_build_object('correct',q->'correct','translation',q->'translation')); END IF;
 IF s->>'phase'='finished' THEN
   SELECT jsonb_agg(jsonb_build_object('term',value->'term','example',value->'example','translation',value->'translation',
     'explanation',value->'options'->((value->>'correct')::integer),
     'chosen',CASE WHEN (s->'answers'->(ordinality-1)::integer->>viewer)::integer >=0 THEN value->'options'->((s->'answers'->(ordinality-1)::integer->>viewer)::integer) ELSE NULL END,
     'correct',(s->'answers'->(ordinality-1)::integer->>viewer)::integer=(value->>'correct')::integer) ORDER BY ordinality)
   INTO review FROM jsonb_array_elements(s->'questions') WITH ORDINALITY;
   result=result||jsonb_build_object('review',review);
 END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.campus_quiz_update(jsonb,text,text,jsonb),public.campus_quiz_view(jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.campus_game(actor uuid, game_table text, operation text, payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp SET lock_timeout='2s' AS $$
DECLARE t campus_game_tables; own campus_game_members; person campus_members;
 n integer; changed integer; roster jsonb; ids jsonb; state_next jsonb;
BEGIN
 IF game_table NOT IN ('four','boxes','wortquest') OR operation NOT IN ('read','join','ready','commit','leave','photo','target','quiz-level','quiz-start','quiz-answer','quiz-next')
 OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>16000 THEN
   RETURN jsonb_build_object('error','Invalid game request');
 END IF;
 IF (game_table='wortquest' AND operation='commit') OR (game_table<>'wortquest' AND operation LIKE 'quiz-%') THEN RETURN jsonb_build_object('error','Invalid game action'); END IF;
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
 WHERE g.table_id IN ('four','boxes','wortquest') AND g.state->>'phase'='playing'
 AND (SELECT count(*) FROM campus_game_members m WHERE m.table_id=g.table_id)<>jsonb_array_length(g.state->'players');
 UPDATE campus_game_tables g SET state=NULL,round=gen_random_uuid(),version=g.version+1
 WHERE g.table_id IN ('four','boxes','wortquest') AND g.state IS NOT NULL
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
 IF operation IN ('ready','commit','leave','photo','target','quiz-level','quiz-start','quiz-answer','quiz-next') AND (own.user_id IS NULL OR own.table_id<>game_table) THEN
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
 IF game_table='wortquest' AND operation='ready' AND payload->>'level' IS DISTINCT FROM t.quiz_level THEN RETURN jsonb_build_object('error','Confirm the selected practice level'); END IF;
 IF game_table='wortquest' AND operation IN ('quiz-level','quiz-start','quiz-answer','quiz-next') THEN
   IF payload->>'round' IS DISTINCT FROM t.round::text THEN RETURN jsonb_build_object('error','The round changed. Try again.'); END IF;
   IF operation='quiz-level' THEN
     IF t.state->>'phase'='playing' THEN RETURN jsonb_build_object('error','Finish or leave this quiz before changing level'); END IF;
     IF coalesce(payload->>'level','') NOT IN ('A1','A2','B1','B2','C1','C2') THEN RETURN jsonb_build_object('error','Choose a practice level'); END IF;
     IF payload->>'level' IS DISTINCT FROM t.quiz_level THEN
       UPDATE campus_game_members SET ready=false WHERE table_id=game_table;
       UPDATE campus_game_tables SET state=NULL,quiz_level=payload->>'level',round=gen_random_uuid(),version=version+1 WHERE table_id=game_table RETURNING * INTO t;
     END IF;
   ELSIF operation='quiz-start' THEN
     SELECT count(*),jsonb_agg(m.player_id::text ORDER BY m.joined_at,m.player_id) INTO n,ids FROM campus_game_members m WHERE m.table_id=game_table;
     IF t.state->>'phase'='playing' OR n<2 OR EXISTS(SELECT 1 FROM campus_game_members m WHERE m.table_id=game_table AND NOT ready) OR payload->>'level' IS DISTINCT FROM t.quiz_level THEN RETURN jsonb_build_object('error','Wait for everyone to confirm this level'); END IF;
     IF jsonb_typeof(payload->'questions') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'questions')<>10 THEN RETURN jsonb_build_object('error','Invalid quiz deck'); END IF;
     IF EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'questions') q WHERE
       jsonb_typeof(q->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(q->'options')<>4 OR
       coalesce(q->>'correct','') !~ '^[0-3]$' OR coalesce(q->>'id','') !~ ('^de-'||lower(t.quiz_level)||'-[0-9]{2}$') OR
       jsonb_typeof(q->'term') IS DISTINCT FROM 'string' OR jsonb_typeof(q->'example') IS DISTINCT FROM 'string') OR
       (SELECT count(DISTINCT q->>'id') FROM jsonb_array_elements(payload->'questions') q)<>10 THEN RETURN jsonb_build_object('error','Invalid quiz deck'); END IF;
     state_next=jsonb_build_object('kind','wortquest','phase','playing','stage','answering','players',ids,'index',0,
       'questions',payload->'questions','answers',(SELECT jsonb_agg('{}'::jsonb) FROM generate_series(1,10)),
       'continued','[]'::jsonb,'scores',(SELECT jsonb_agg(0) FROM generate_series(1,n)));
     UPDATE campus_game_members SET ready=false WHERE table_id=game_table;
     UPDATE campus_game_tables SET state=state_next,round=gen_random_uuid(),version=version+1 WHERE table_id=game_table RETURNING * INTO t;
   ELSE
     state_next=public.campus_quiz_update(t.state,own.player_id::text,operation,payload);
     IF state_next ? 'error' THEN RETURN state_next; END IF;
     IF state_next IS DISTINCT FROM t.state THEN
       UPDATE campus_game_tables SET state=state_next,version=version+1 WHERE table_id=game_table RETURNING * INTO t;
     END IF;
   END IF;
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
   'count',n,'members',roster,'level',CASE WHEN game_table='wortquest' AND own.table_id=game_table THEN t.quiz_level ELSE NULL END,
   'quiz',CASE WHEN game_table='wortquest' AND own.table_id=game_table THEN public.campus_quiz_view(t.state,own.player_id::text,t.quiz_level) ELSE NULL END,
   'state',CASE WHEN game_table<>'wortquest' AND own.table_id=game_table THEN t.state ELSE NULL END);
END; $$;
REVOKE ALL ON FUNCTION public.campus_game(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_game(uuid,text,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.campus_games_switch_cleanup() RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF (TG_OP='DELETE' AND OLD.key='virtual_campus_enabled') OR
    (TG_OP='UPDATE' AND NEW.key='virtual_campus_enabled' AND NOT coalesce(NEW.enabled,false)) THEN
   DELETE FROM campus_game_members WHERE table_id IN ('four','boxes','wortquest');
   UPDATE campus_game_tables SET state=NULL,round=gen_random_uuid(),version=version+1 WHERE table_id IN ('four','boxes','wortquest');
 END IF;
 RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.campus_games_switch_cleanup() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
