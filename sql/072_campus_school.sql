-- Whole-school bounds, solid walls/doorways and existing-course study stations.
-- Additive follow-up to 071. Prepared for review; no hosted application is implied.
BEGIN;
ALTER TABLE public.campus_presence DROP CONSTRAINT campus_presence_x_check;
ALTER TABLE public.campus_presence ADD CONSTRAINT campus_presence_x_check CHECK(x BETWEEN -64 AND 64);
ALTER TABLE public.campus_presence DROP CONSTRAINT campus_presence_z_check;
ALTER TABLE public.campus_presence ADD CONSTRAINT campus_presence_z_check CHECK(z BETWEEN -39 AND 42);
ALTER TABLE public.campus_presence DROP CONSTRAINT campus_presence_seat_check;
ALTER TABLE public.campus_presence ADD CONSTRAINT campus_presence_seat_check CHECK(seat IN ('desk-1','desk-2','desk-3','desk-4','lab-1','lab-2','lab-3','lab-4','class-1','class-2'));

CREATE FUNCTION public.campus_school_walkable(px double precision,pz double precision) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT px BETWEEN -64 AND 64 AND pz BETWEEN -39 AND 42 AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements('[{"minX":-36.18,"maxX":-15.82,"minZ":-35.18,"maxZ":-34.82},{"minX":-36.18,"maxX":-35.82,"minZ":-35,"maxZ":-17},{"minX":-16.18,"maxX":-15.82,"minZ":-35,"maxZ":-17},{"minX":-36,"maxX":-28.4,"minZ":-17.18,"maxZ":-16.82},{"minX":-23.6,"maxX":-16,"minZ":-17.18,"maxZ":-16.82},{"minX":-10.18,"maxX":10.18,"minZ":-35.18,"maxZ":-34.82},{"minX":-10.18,"maxX":-9.82,"minZ":-35,"maxZ":-17},{"minX":9.82,"maxX":10.18,"minZ":-35,"maxZ":-17},{"minX":-10,"maxX":-2.4,"minZ":-17.18,"maxZ":-16.82},{"minX":2.4,"maxX":10,"minZ":-17.18,"maxZ":-16.82},{"minX":15.82,"maxX":36.18,"minZ":-35.18,"maxZ":-34.82},{"minX":15.82,"maxX":16.18,"minZ":-35,"maxZ":-17},{"minX":35.82,"maxX":36.18,"minZ":-35,"maxZ":-17},{"minX":16,"maxX":23.6,"minZ":-17.18,"maxZ":-16.82},{"minX":28.4,"maxX":36,"minZ":-17.18,"maxZ":-16.82},{"minX":-62.18,"maxX":-41.82,"minZ":-9.18,"maxZ":-8.82},{"minX":-62.18,"maxX":-61.82,"minZ":-9,"maxZ":9},{"minX":-42.18,"maxX":-41.82,"minZ":-9,"maxZ":9},{"minX":-62,"maxX":-54.4,"minZ":8.82,"maxZ":9.18},{"minX":-49.6,"maxX":-42,"minZ":8.82,"maxZ":9.18},{"minX":-36.18,"maxX":-15.82,"minZ":-9.18,"maxZ":-8.82},{"minX":-36.18,"maxX":-35.82,"minZ":-9,"maxZ":9},{"minX":-16.18,"maxX":-15.82,"minZ":-9,"maxZ":9},{"minX":-36,"maxX":-28.4,"minZ":8.82,"maxZ":9.18},{"minX":-23.6,"maxX":-16,"minZ":8.82,"maxZ":9.18},{"minX":-10.18,"maxX":10.18,"minZ":-9.18,"maxZ":-8.82},{"minX":-10.18,"maxX":-9.82,"minZ":-9,"maxZ":9},{"minX":9.82,"maxX":10.18,"minZ":-9,"maxZ":9},{"minX":-10,"maxX":-2.4,"minZ":8.82,"maxZ":9.18},{"minX":2.4,"maxX":10,"minZ":8.82,"maxZ":9.18},{"minX":15.82,"maxX":36.18,"minZ":-9.18,"maxZ":-8.82},{"minX":15.82,"maxX":16.18,"minZ":-9,"maxZ":9},{"minX":35.82,"maxX":36.18,"minZ":-9,"maxZ":9},{"minX":16,"maxX":23.6,"minZ":8.82,"maxZ":9.18},{"minX":28.4,"maxX":36,"minZ":8.82,"maxZ":9.18},{"minX":-62.18,"maxX":-41.82,"minZ":16.82,"maxZ":17.18},{"minX":-62.18,"maxX":-61.82,"minZ":17,"maxZ":35},{"minX":-42.18,"maxX":-41.82,"minZ":17,"maxZ":35},{"minX":-62,"maxX":-54.4,"minZ":34.82,"maxZ":35.18},{"minX":-49.6,"maxX":-42,"minZ":34.82,"maxZ":35.18},{"minX":-36.18,"maxX":-15.82,"minZ":16.82,"maxZ":17.18},{"minX":-36.18,"maxX":-35.82,"minZ":17,"maxZ":35},{"minX":-16.18,"maxX":-15.82,"minZ":17,"maxZ":35},{"minX":-36,"maxX":-28.4,"minZ":34.82,"maxZ":35.18},{"minX":-23.6,"maxX":-16,"minZ":34.82,"maxZ":35.18},{"minX":-10.18,"maxX":10.18,"minZ":16.82,"maxZ":17.18},{"minX":-10.18,"maxX":-9.82,"minZ":17,"maxZ":35},{"minX":9.82,"maxX":10.18,"minZ":17,"maxZ":35},{"minX":-10,"maxX":-2.4,"minZ":34.82,"maxZ":35.18},{"minX":2.4,"maxX":10,"minZ":34.82,"maxZ":35.18},{"minX":15.82,"maxX":36.18,"minZ":16.82,"maxZ":17.18},{"minX":15.82,"maxX":16.18,"minZ":17,"maxZ":35},{"minX":35.82,"maxX":36.18,"minZ":17,"maxZ":35},{"minX":16,"maxX":23.6,"minZ":34.82,"maxZ":35.18},{"minX":28.4,"maxX":36,"minZ":34.82,"maxZ":35.18}]'::jsonb) w
  WHERE px>(w->>'minX')::double precision-.34 AND px<(w->>'maxX')::double precision+.34
    AND pz>(w->>'minZ')::double precision-.34 AND pz<(w->>'maxZ')::double precision+.34
 );
$$;
CREATE FUNCTION public.campus_school_walk(from_x double precision,from_z double precision,dx double precision,dz double precision,seconds double precision)
RETURNS TABLE(x double precision,z double precision) LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE duration double precision:=least(.35,greatest(0,seconds));steps integer; n integer;
 sx double precision;sz double precision;nx double precision;nz double precision;divisor double precision:=greatest(1,sqrt(dx*dx+dz*dz));
BEGIN
 x:=from_x;z:=from_z;steps:=greatest(1,ceil(duration/.05)::integer);
 sx:=dx/divisor*3*duration/steps;sz:=dz/divisor*3*duration/steps;
 FOR n IN 1..steps LOOP
  nx:=greatest(-64,least(64,x+sx));IF public.campus_school_walkable(nx,z) THEN x:=nx;END IF;
  nz:=greatest(-39,least(42,z+sz));IF public.campus_school_walkable(x,nz) THEN z:=nz;END IF;
 END LOOP;
 RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.campus_school_walkable(double precision,double precision),public.campus_school_walk(double precision,double precision,double precision,double precision,double precision) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_school_walkable(double precision,double precision),public.campus_school_walk(double precision,double precision,double precision,double precision,double precision) TO service_role;

CREATE OR REPLACE FUNCTION public.campus_runtime(
 runtime_connection uuid,
 runtime_operation text,
 runtime_commands jsonb DEFAULT '[]'::jsonb,
 ticket_hash text DEFAULT NULL,
 expected_campus uuid DEFAULT NULL,
 runtime_renew boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 at_time timestamptz;
 identity jsonb;
 own uuid;
 member_user uuid;
 player campus_presence;
 command jsonb;
 value jsonb;
 command_type text;
 command_count integer;
 n integer;
 input_seq bigint;
 dx double precision;
 dz double precision;
 seat_x double precision;
 seat_z double precision;
 seat_id text;
 notice text;
 snapshot jsonb;
BEGIN
 IF runtime_connection IS NULL OR runtime_operation IS NULL OR runtime_operation NOT IN ('connect','step','leave') THEN
  RETURN jsonb_build_object('ended',true);
 END IF;
 IF jsonb_typeof(runtime_commands) IS DISTINCT FROM 'array' OR jsonb_array_length(runtime_commands)>5 THEN
  RETURN jsonb_build_object('ended',true);
 END IF;
 -- Admission takes the member lock first, matching ticket issuance/upgrade claims.
 -- Otherwise its FK insert could wait on an issuer that is waiting for its ticket.
 IF runtime_operation='connect' THEN
  IF ticket_hash IS NULL OR ticket_hash !~ '^[0-9a-f]{64}$' OR expected_campus IS NULL THEN
   RETURN jsonb_build_object('ended',true);
  END IF;
  PERFORM 1 FROM campus_members WHERE campus_id=expected_campus FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ended',true); END IF;
 END IF;
 -- Bounded lock waits are configured below. Read clock time AFTER acquiring the
 -- library lock so queued transactions cannot move the simulation backwards.
 PERFORM 1 FROM campus_runtime_lock WHERE room='library' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Campus runtime unavailable'; END IF;
 at_time := clock_timestamp();
 DELETE FROM campus_presence p WHERE lease_until<=at_time OR NOT public.campus_allowed(p.campus_id)
  OR EXISTS(SELECT 1 FROM campus_members m WHERE m.campus_id=p.campus_id AND m.pseudonym !~ '^[A-Za-z]+ [A-Za-z]+ [0-9a-f]{6}$');

 IF runtime_operation='connect' THEN
  IF NOT EXISTS(SELECT 1 FROM campus_tickets t WHERE t.token_hash=ticket_hash AND t.handshake_started_at IS NOT NULL) THEN
   RETURN jsonb_build_object('ended',true);
  END IF;
  identity := public.campus_redeem_ticket(ticket_hash);
  IF identity IS NULL OR (identity->>'id')::uuid<>expected_campus
   OR identity->>'pseudonym' !~ '^[A-Za-z]+ [A-Za-z]+ [0-9a-f]{6}$' THEN
   RETURN jsonb_build_object('ended',true);
  END IF;
  own := expected_campus;
  SELECT * INTO player FROM campus_presence WHERE campus_id=own;
  IF FOUND THEN
   IF runtime_renew IS NOT TRUE OR player.opened_at>at_time-interval '180 seconds' THEN
    RETURN jsonb_build_object('error','Already connected in another tab.');
   END IF;
   -- A fresh, account-bound ticket transfers authority near the duration limit.
   -- Position/seat/coarse status survive; the old connection can no longer act or delete this row.
   UPDATE campus_presence SET connection_id=runtime_connection,opened_at=at_time,
    input_x=0,input_z=0,input_at=at_time,simulated_at=at_time,sequence=-1,
    lease_until=at_time+interval '15 seconds',rate_at=at_time,rate_count=0 WHERE campus_id=own;
  ELSE
   IF runtime_renew IS TRUE THEN RETURN jsonb_build_object('ended',true); END IF;
   SELECT count(*) INTO n FROM campus_presence;
   IF n>=10 THEN RETURN jsonb_build_object('error','The library is full. Please try again later.'); END IF;
   INSERT INTO campus_presence(campus_id,connection_id,opened_at,x,z,input_at,simulated_at,lease_until,rate_at)
    VALUES(own,runtime_connection,at_time,(n%5)-2,4,at_time,at_time,at_time+interval '15 seconds',at_time);
  END IF;
 ELSE
  SELECT * INTO player FROM campus_presence WHERE connection_id=runtime_connection;
  IF NOT FOUND THEN RETURN jsonb_build_object('ended',true); END IF;
  own := player.campus_id;
  IF runtime_operation='leave' THEN
   DELETE FROM campus_presence WHERE connection_id=runtime_connection;
   RETURN jsonb_build_object('ended',true);
  END IF;
 END IF;

 -- Integrate only the portion of the last accepted input that is still fresh.
 -- Speed is 3 units/sec, diagonals normalize, bounds and the 350ms stop are global.
 WITH movement AS (
  SELECT campus_id,x,z,input_x,input_z,
   greatest(0,extract(epoch FROM (least(at_time,input_at+interval '350 milliseconds')-simulated_at))) AS seconds
  FROM campus_presence WHERE status='walking' AND (input_x<>0 OR input_z<>0)
   AND simulated_at<least(at_time,input_at+interval '350 milliseconds')
 )
 UPDATE campus_presence p SET x=walk.x,z=walk.z,
  rotation=atan2(p.input_x,p.input_z),simulated_at=at_time
 FROM movement m CROSS JOIN LATERAL public.campus_school_walk(m.x,m.z,m.input_x,m.input_z,m.seconds::double precision) walk
 WHERE p.campus_id=m.campus_id;

 SELECT * INTO player FROM campus_presence WHERE campus_id=own;
 command_count := jsonb_array_length(runtime_commands);
 IF at_time-player.rate_at>=interval '1 second' THEN
  player.rate_at:=at_time; player.rate_count:=0;
 END IF;
 IF player.rate_count+command_count<=30 THEN
  FOR command IN SELECT jsonb_array_elements(runtime_commands) LOOP
   player.rate_count:=player.rate_count+1;
   IF jsonb_typeof(command) IS DISTINCT FROM 'object' THEN CONTINUE; END IF;
   SELECT count(*) INTO n FROM jsonb_object_keys(command);
   IF n<>2 OR NOT(command ? 'type' AND command ? 'data') THEN CONTINUE; END IF;
   command_type:=command->>'type'; value:=command->'data';
   IF command_type='input' AND player.status='walking' AND jsonb_typeof(value)='object' THEN
    SELECT count(*) INTO n FROM jsonb_object_keys(value);
    IF n<>3 OR NOT(value ? 'x' AND value ? 'z' AND value ? 'seq')
     OR jsonb_typeof(value->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(value->'z') IS DISTINCT FROM 'number'
     OR jsonb_typeof(value->'seq') IS DISTINCT FROM 'number' THEN CONTINUE; END IF;
    -- Numeric validation precedes casts, including the JS safe-integer limit.
    IF abs((value->>'x')::numeric)>1 OR abs((value->>'z')::numeric)>1
     OR (value->>'seq')::numeric<0 OR (value->>'seq')::numeric>9007199254740991
     OR trunc((value->>'seq')::numeric)<>(value->>'seq')::numeric THEN CONTINUE; END IF;
    dx:=(value->>'x')::double precision; dz:=(value->>'z')::double precision;
    input_seq:=(value->>'seq')::bigint;
    IF input_seq<=player.sequence THEN CONTINUE; END IF;
    player.sequence:=input_seq; player.input_x:=dx; player.input_z:=dz;
    player.input_at:=at_time; player.simulated_at:=at_time;
   ELSIF command_type='sit' AND jsonb_typeof(value)='string' THEN
    seat_id:=value#>>'{}';
    seat_x:=CASE seat_id WHEN 'desk-1' THEN -4.5 WHEN 'desk-2' THEN -1.5 WHEN 'desk-3' THEN 1.5 WHEN 'desk-4' THEN 4.5 WHEN 'lab-1' THEN 21.5 WHEN 'lab-2' THEN 24.5 WHEN 'lab-3' THEN 27.5 WHEN 'lab-4' THEN 30.5 WHEN 'class-1' THEN -3 WHEN 'class-2' THEN 3 ELSE NULL END;
    seat_z:=CASE seat_id WHEN 'desk-1' THEN -3 WHEN 'desk-2' THEN -3 WHEN 'desk-3' THEN -3 WHEN 'desk-4' THEN -3 WHEN 'lab-1' THEN -3 WHEN 'lab-2' THEN -3 WHEN 'lab-3' THEN -3 WHEN 'lab-4' THEN -3 WHEN 'class-1' THEN -29 WHEN 'class-2' THEN -29 ELSE NULL END;
    IF player.seat IS NULL AND seat_x IS NOT NULL
     AND sqrt((player.x-seat_x)^2+(player.z-seat_z)^2)<=2.1
     AND NOT EXISTS(SELECT 1 FROM campus_presence WHERE seat=seat_id) THEN
     player.x:=seat_x; player.z:=seat_z; player.rotation:=pi();
     player.seat:=seat_id; player.status:='seated'; player.input_x:=0; player.input_z:=0;
     -- Publish within the transaction before another command can reserve it.
     UPDATE campus_presence SET seat=seat_id,status='seated' WHERE campus_id=own;
    ELSE notice:='Move closer to an available seat.';
    END IF;
   ELSIF command_type='action' AND player.seat IS NOT NULL AND jsonb_typeof(value)='string' THEN
    IF value#>>'{}'='stand' THEN
     player.z:=player.z+1; player.seat:=NULL; player.status:='walking';
     player.input_x:=0; player.input_z:=0; player.simulated_at:=at_time;
     UPDATE campus_presence SET seat=NULL,status='walking' WHERE campus_id=own;
    ELSIF value#>>'{}'='study' THEN player.status:='studying';
    ELSIF value#>>'{}'='close' THEN player.status:='seated';
    END IF;
   END IF;
  END LOOP;
 ELSE
  player.rate_count:=30;
 END IF;
 UPDATE campus_presence SET x=player.x,z=player.z,rotation=player.rotation,
  seat=player.seat,status=player.status,input_x=player.input_x,input_z=player.input_z,
  input_at=player.input_at,simulated_at=player.simulated_at,sequence=player.sequence,
  lease_until=at_time+interval '15 seconds',rate_at=player.rate_at,rate_count=player.rate_count
 WHERE campus_id=own;
 SELECT user_id INTO member_user FROM campus_members WHERE campus_id=own;
 SELECT jsonb_build_object('self',own,
  'players',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id',p.campus_id,'pseudonym',m.pseudonym,'colour',m.colour,
   'x',p.x,'z',p.z,'rotation',p.rotation,'seat',p.seat,'status',p.status) ORDER BY p.campus_id)
   FROM campus_presence p JOIN campus_members m USING(campus_id)
   WHERE NOT EXISTS(SELECT 1 FROM campus_blocks b WHERE b.owner_id=member_user AND b.target=p.campus_id)), '[]'::jsonb),
  'occupied',coalesce((SELECT jsonb_agg(seat ORDER BY seat) FROM campus_presence WHERE seat IS NOT NULL),'[]'::jsonb)
 ) INTO snapshot;
 RETURN jsonb_build_object('snapshot',snapshot,'notice',notice,'world_revision','school-v1');
END;
$$;
-- Bound lock waits and runaway work independently of the HTTP caller.
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) SET lock_timeout='2s';
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) SET statement_timeout='4s';

REVOKE ALL ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) TO service_role;
COMMIT;
