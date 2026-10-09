BEGIN;
-- Private B2B enquiry inbox and durable staff notifications. No public table/RPC access.
CREATE TABLE public.business_enquiries (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  organisation text NOT NULL CHECK (char_length(btrim(organisation)) BETWEEN 1 AND 160),
  goal text NOT NULL CHECK (char_length(btrim(goal)) BETWEEN 1 AND 3000),
  timing text NOT NULL DEFAULT '' CHECK (char_length(timing) <= 160),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  notification_status text NOT NULL DEFAULT 'queued' CHECK (notification_status IN ('queued','sending','sent','exhausted')),
  notification_attempts integer NOT NULL DEFAULT 0 CHECK (notification_attempts BETWEEN 0 AND 5),
  next_notification_at timestamptz NOT NULL DEFAULT now(),
  notification_lease_token uuid,
  notification_lease_expires_at timestamptz,
  provider_message_id text,
  notification_error_code text,
  notified_at timestamptz
);
CREATE INDEX business_enquiries_notification_queue ON public.business_enquiries(next_notification_at)
  WHERE notification_status IN ('queued','sending');
CREATE TABLE public.business_enquiry_rate_limits (
  key_hash text NOT NULL CHECK (key_hash ~ '^(ip|email):[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (key_hash,window_start)
);
CREATE INDEX business_enquiry_rate_limits_expiry ON public.business_enquiry_rate_limits(window_start);
ALTER TABLE public.business_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_enquiry_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_enquiries,public.business_enquiry_rate_limits FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.business_enquiries,public.business_enquiry_rate_limits TO service_role;

CREATE FUNCTION public.receive_business_enquiry(
  p_id uuid,p_name text,p_email text,p_organisation text,p_goal text,p_timing text,
  p_ip_hash text,p_email_hash text,p_payload_hash text
) RETURNS TABLE(enquiry_id uuid,outcome text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  existing_hash text;
  bucket timestamptz := to_timestamp(floor(extract(epoch FROM now())/600)*600);
BEGIN
  IF p_id IS NULL OR p_ip_hash IS NULL OR p_email_hash IS NULL OR p_payload_hash IS NULL
    OR p_ip_hash !~ '^[0-9a-f]{64}$' OR p_email_hash !~ '^[0-9a-f]{64}$' OR p_payload_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid enquiry metadata' USING ERRCODE='22023';
  END IF;
  -- Serialize a submission token before checking it. Repeat submissions do not consume limits.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  SELECT payload_hash INTO existing_hash FROM business_enquiries WHERE id=p_id;
  IF FOUND THEN
    RETURN QUERY SELECT p_id,CASE WHEN existing_hash=p_payload_hash THEN 'duplicate' ELSE 'conflict' END;
    RETURN;
  END IF;
  -- Fixed lock ordering prevents deadlocks and makes both counters atomic across instances.
  PERFORM pg_advisory_xact_lock(hashtextextended('email:'||p_email_hash,1));
  PERFORM pg_advisory_xact_lock(hashtextextended('ip:'||p_ip_hash,1));
  IF coalesce((SELECT attempts FROM business_enquiry_rate_limits WHERE key_hash='email:'||p_email_hash AND window_start=bucket),0)>=3
    OR coalesce((SELECT attempts FROM business_enquiry_rate_limits WHERE key_hash='ip:'||p_ip_hash AND window_start=bucket),0)>=5 THEN
    RETURN QUERY SELECT NULL::uuid,'limited'::text;
    RETURN;
  END IF;
  INSERT INTO business_enquiries(id,name,email,organisation,goal,timing,payload_hash)
    VALUES(p_id,p_name,p_email,p_organisation,p_goal,coalesce(p_timing,''),p_payload_hash);
  INSERT INTO business_enquiry_rate_limits(key_hash,window_start,attempts)
    VALUES('email:'||p_email_hash,bucket,1),('ip:'||p_ip_hash,bucket,1)
    ON CONFLICT(key_hash,window_start) DO UPDATE SET attempts=business_enquiry_rate_limits.attempts+1;
  -- Hashes expire; no raw request IP is stored. Keep cleanup bounded under public traffic.
  DELETE FROM business_enquiry_rate_limits WHERE (key_hash,window_start) IN
    (SELECT key_hash,window_start FROM business_enquiry_rate_limits WHERE window_start<now()-interval '1 day' LIMIT 500);
  RETURN QUERY SELECT p_id,'saved'::text;
END;
$$;

CREATE FUNCTION public.claim_business_enquiry_notifications(p_enquiry_id uuid DEFAULT NULL,p_limit integer DEFAULT 10)
RETURNS SETOF public.business_enquiries
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  DELETE FROM business_enquiry_rate_limits WHERE (key_hash,window_start) IN
    (SELECT key_hash,window_start FROM business_enquiry_rate_limits WHERE window_start<now()-interval '1 day' LIMIT 500);
  -- Bound retries while allowing daily cron schedules to recover; retain exhausted records.
  UPDATE business_enquiries SET notification_status='exhausted',notification_error_code='retry-window-expired',
    notification_lease_token=NULL,notification_lease_expires_at=NULL
    WHERE notification_status IN ('queued','sending')
      AND (created_at<now()-interval '7 days' OR (notification_attempts>=5 AND coalesce(notification_lease_expires_at,'-infinity')<=now()));
  RETURN QUERY
    WITH due AS (
      SELECT id FROM business_enquiries
      WHERE (p_enquiry_id IS NULL OR id=p_enquiry_id) AND notification_attempts<5
        AND ((notification_status='queued' AND next_notification_at<=now())
          OR (notification_status='sending' AND notification_lease_expires_at<=now()))
      ORDER BY next_notification_at,id
      LIMIT greatest(1,least(coalesce(p_limit,10),10)) FOR UPDATE SKIP LOCKED
    )
    UPDATE business_enquiries e SET notification_status='sending',notification_attempts=e.notification_attempts+1,
      notification_lease_token=gen_random_uuid(),notification_lease_expires_at=now()+interval '5 minutes'
    FROM due WHERE e.id=due.id RETURNING e.*;
END;
$$;

CREATE FUNCTION public.finish_business_enquiry_notification(
  p_id uuid,p_lease_token uuid,p_success boolean,p_provider_message_id text DEFAULT NULL,p_error_code text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF p_success AND (p_provider_message_id IS NULL OR btrim(p_provider_message_id)='') THEN
    RAISE EXCEPTION 'Provider acceptance requires a message ID' USING ERRCODE='22023';
  END IF;
  UPDATE business_enquiries SET
    notification_status=CASE WHEN p_success THEN 'sent' WHEN notification_attempts>=5 THEN 'exhausted' ELSE 'queued' END,
    next_notification_at=now()+CASE notification_attempts WHEN 1 THEN interval '1 minute' WHEN 2 THEN interval '5 minutes'
      WHEN 3 THEN interval '30 minutes' ELSE interval '120 minutes' END,
    provider_message_id=CASE WHEN p_success THEN left(p_provider_message_id,200) ELSE provider_message_id END,
    notification_error_code=CASE WHEN p_success THEN NULL ELSE CASE WHEN p_error_code IN
      ('provider-error','provider-timeout','provider-unconfigured','invalid-recipient','invalid-record') THEN p_error_code ELSE 'provider-error' END END,
    notified_at=CASE WHEN p_success THEN now() ELSE notified_at END,
    notification_lease_token=NULL,notification_lease_expires_at=NULL
    WHERE id=p_id AND notification_status='sending' AND notification_lease_token=p_lease_token;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.receive_business_enquiry(uuid,text,text,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_business_enquiry_notifications(uuid,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finish_business_enquiry_notification(uuid,uuid,boolean,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_business_enquiry(uuid,text,text,text,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_business_enquiry_notifications(uuid,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_business_enquiry_notification(uuid,uuid,boolean,text,text) TO service_role;
COMMIT;
