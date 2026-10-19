-- Preserve hosted safe-update guards: focus glass has one constrained room row.
-- Forward repair of 074; never rewrite/reapply that migration on an existing campus.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $repair$
DECLARE
 signature text;
 definition text;
 original text;
 replacement text;
BEGIN
 FOREACH signature IN ARRAY ARRAY[
  'public.campus_runtime_school(uuid,text,jsonb,text,uuid,boolean)',
  'public.campus_runtime(uuid,text,jsonb,text,uuid,boolean)'
 ] LOOP
  definition:=pg_get_functiondef(signature::regprocedure);
  IF signature LIKE 'public.campus_runtime_school(%' THEN
   original:=$source$UPDATE campus_focus_glass SET frosted=CASE WHEN value->>'room'=ANY(frosted) THEN array_remove(frosted,value->>'room') ELSE array_append(frosted,value->>'room') END;$source$;
   replacement:=$source$UPDATE campus_focus_glass SET frosted=CASE WHEN value->>'room'=ANY(frosted) THEN array_remove(frosted,value->>'room') ELSE array_append(frosted,value->>'room') END WHERE room='library';$source$;
  ELSE
   IF position('school-v3-living-cube' IN definition)=0 THEN
    RAISE EXCEPTION 'Unexpected campus revision: stop and review';
   END IF;
   original:=$source$UPDATE campus_focus_glass SET frosted='{}';$source$;
   replacement:=$source$UPDATE campus_focus_glass SET frosted='{}' WHERE room='library';$source$;
  END IF;
  IF (length(definition)-length(replace(definition,original,'')))/length(original)<>1 THEN
   RAISE EXCEPTION 'Unexpected campus function source or repair already applied: %',signature;
  END IF;
  -- CREATE OR REPLACE retains existing ownership, grants and function settings.
  EXECUTE replace(definition,original,replacement);
 END LOOP;
END;
$repair$;
COMMIT;
