BEGIN;
-- Optional Vercel transport. Requires 070; does not enable the campus or change courses.
-- One lock serializes the ten-place library across all function instances.
CREATE TABLE public.campus_runtime_lock (
 room text PRIMARY KEY CHECK(room='library')
);
INSERT INTO public.campus_runtime_lock VALUES('library');
ALTER TABLE public.campus_tickets ADD COLUMN handshake_started_at timestamptz;
-- One upgrade attempt per freshly issued ticket. Ticket issuance already has
-- a database-backed three-second per-member limit, including across instances.
CREATE FUNCTION public.campus_begin_socket() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid;
BEGIN
 SELECT campus_id INTO target FROM campus_members WHERE user_id=auth.uid() FOR UPDATE;
 IF target IS NULL OR NOT public.campus_allowed(target) THEN RETURN false; END IF;
 UPDATE campus_tickets SET handshake_started_at=clock_timestamp()
  WHERE campus_id=target AND expires_at>clock_timestamp() AND handshake_started_at IS NULL;
 RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.campus_begin_socket() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_begin_socket() TO authenticated;
CREATE TABLE public.campus_presence (
 campus_id uuid PRIMARY KEY REFERENCES public.campus_members(campus_id) ON DELETE CASCADE,
 connection_id uuid UNIQUE NOT NULL,
 opened_at timestamptz NOT NULL,
 x double precision NOT NULL CHECK(x BETWEEN -9 AND 9),
 z double precision NOT NULL CHECK(z BETWEEN -7 AND 7),
 rotation double precision NOT NULL DEFAULT 0,
 status text NOT NULL DEFAULT 'walking' CHECK(status IN ('walking','seated','studying')),
 seat text CHECK(seat IN ('desk-1','desk-2','desk-3','desk-4')),
 input_x double precision NOT NULL DEFAULT 0 CHECK(input_x BETWEEN -1 AND 1),
 input_z double precision NOT NULL DEFAULT 0 CHECK(input_z BETWEEN -1 AND 1),
 input_at timestamptz NOT NULL,
 simulated_at timestamptz NOT NULL,
 sequence bigint NOT NULL DEFAULT -1 CHECK(sequence BETWEEN -1 AND 9007199254740991),
 lease_until timestamptz NOT NULL,
 rate_at timestamptz NOT NULL,
 rate_count integer NOT NULL DEFAULT 0 CHECK(rate_count>=0),
 CHECK((seat IS NULL AND status='walking') OR (seat IS NOT NULL AND status IN ('seated','studying')))
);
CREATE UNIQUE INDEX campus_presence_one_seat ON public.campus_presence(seat) WHERE seat IS NOT NULL;
ALTER TABLE public.campus_runtime_lock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_presence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_runtime_lock,public.campus_presence FROM PUBLIC,anon,authenticated,service_role;

-- Called only by the application server. connection_id stays inside this boundary;
-- it is never returned in snapshots, URLs, browser storage or peer messages.
CREATE FUNCTION public.campus_runtime(
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
  SELECT campus_id,
   greatest(0,extract(epoch FROM (least(at_time,input_at+interval '350 milliseconds')-simulated_at))) AS seconds,
   greatest(1,sqrt(input_x*input_x+input_z*input_z)) AS length
  FROM campus_presence WHERE status='walking' AND (input_x<>0 OR input_z<>0)
   AND simulated_at<least(at_time,input_at+interval '350 milliseconds')
 )
 UPDATE campus_presence p SET
  x=greatest(-9,least(9,p.x+p.input_x/m.length*3*m.seconds)),
  z=greatest(-7,least(7,p.z+p.input_z/m.length*3*m.seconds)),
  rotation=atan2(p.input_x,p.input_z),simulated_at=at_time
 FROM movement m WHERE p.campus_id=m.campus_id;

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
    seat_x:=CASE seat_id WHEN 'desk-1' THEN -4.5 WHEN 'desk-2' THEN -1.5 WHEN 'desk-3' THEN 1.5 WHEN 'desk-4' THEN 4.5 ELSE NULL END;
    IF player.seat IS NULL AND seat_x IS NOT NULL
     AND sqrt((player.x-seat_x)^2+(player.z+3)^2)<=2.1
     AND NOT EXISTS(SELECT 1 FROM campus_presence WHERE seat=seat_id) THEN
     player.x:=seat_x; player.z:=-3; player.rotation:=pi();
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
 RETURN jsonb_build_object('snapshot',snapshot,'notice',notice);
END;
$$;
-- Bound lock waits and runaway work independently of the HTTP caller.
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) SET lock_timeout='2s';
ALTER FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) SET statement_timeout='4s';
REVOKE ALL ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campus_runtime(uuid,text,jsonb,text,uuid,boolean) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
