BEGIN;
-- Separate personal textbook notes; existing Arbeitsbuch data/access is unchanged.
CREATE TABLE public.workbook_reflections (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 book_key text NOT NULL DEFAULT 'aspekte-neu-b2-lehrbuch' CHECK(book_key='aspekte-neu-b2-lehrbuch'),
 id uuid NOT NULL, page integer NOT NULL CHECK(page BETWEEN 1 AND 202),
 kind text NOT NULL CHECK(kind IN ('question','answer','reflection','vocabulary','bookmark')),
 title text NOT NULL CHECK(length(title)<=1000), body text NOT NULL CHECK(length(body)<=40000),
 resolved boolean NOT NULL DEFAULT false,
 x integer CHECK(x BETWEEN 0 AND 10000), y integer CHECK(y BETWEEN 0 AND 10000),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>=1), updated timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,book_key,id)
);
ALTER TABLE public.workbook_reflections ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.workbook_reflections TO authenticated;
GRANT ALL ON public.workbook_reflections TO service_role;
CREATE POLICY "Own admin textbook reflections" ON public.workbook_reflections FOR SELECT TO authenticated
 USING(user_id=auth.uid() AND public.workbook_admin());
CREATE FUNCTION public.workbook_save_reflection(target_user uuid,entry_id uuid,expected_revision bigint,entry_payload jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles p JOIN auth.users u ON u.id=p.id WHERE p.id=target_user AND p.role='admin'
 AND NOT coalesce(p.is_suspended,false) AND u.email_confirmed_at IS NOT NULL
 AND coalesce(u.raw_user_meta_data->>'is_suspended','false')<>'true') THEN RETURN false; END IF;
 IF expected_revision=0 THEN
  INSERT INTO workbook_reflections(user_id,id,page,kind,title,body,resolved,x,y)
  VALUES(target_user,entry_id,(entry_payload->>'page')::integer,entry_payload->>'kind',entry_payload->>'title',entry_payload->>'body',
   (entry_payload->>'resolved')::integer=1,(entry_payload->>'x')::integer,(entry_payload->>'y')::integer)
  ON CONFLICT(user_id,book_key,id) DO NOTHING;
 ELSE
  UPDATE workbook_reflections SET page=(entry_payload->>'page')::integer,kind=entry_payload->>'kind',title=entry_payload->>'title',body=entry_payload->>'body',
   resolved=(entry_payload->>'resolved')::integer=1,x=(entry_payload->>'x')::integer,y=(entry_payload->>'y')::integer,revision=revision+1,updated=now()
  WHERE user_id=target_user AND book_key='aspekte-neu-b2-lehrbuch' AND id=entry_id AND revision=expected_revision;
 END IF;
 GET DIAGNOSTICS changed=ROW_COUNT; RETURN changed=1;
END;
$$;
REVOKE ALL ON FUNCTION public.workbook_save_reflection(uuid,uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.workbook_save_reflection(uuid,uuid,bigint,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
