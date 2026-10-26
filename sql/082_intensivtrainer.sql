BEGIN;
-- Extend the private registry without changing old rows, existing grants,
-- source policies, invitations or recording permissions.
ALTER TABLE public.workbook_memberships DROP CONSTRAINT workbook_memberships_book_key_check;
ALTER TABLE public.workbook_memberships ADD CONSTRAINT workbook_memberships_book_key_check
 CHECK(book_key IN ('aspekte-neu-b2','aspekte-neu-b2-intensivtrainer'));
ALTER TABLE public.workbook_learning_states DROP CONSTRAINT workbook_learning_states_book_key_check;
ALTER TABLE public.workbook_learning_states ADD CONSTRAINT workbook_learning_states_book_key_check
 CHECK(book_key IN ('aspekte-neu-b2','aspekte-neu-b2-intensivtrainer'));
-- Existing own-state access still requires active membership. These additional
-- restrictions close the new book when an admin role is removed.
CREATE POLICY "Intensivtrainer admin membership" ON public.workbook_memberships AS RESTRICTIVE
 FOR SELECT TO authenticated USING(book_key<>'aspekte-neu-b2-intensivtrainer' OR public.workbook_admin());
CREATE POLICY "Intensivtrainer admin state" ON public.workbook_learning_states AS RESTRICTIVE
 FOR SELECT TO authenticated USING(book_key<>'aspekte-neu-b2-intensivtrainer' OR public.workbook_admin());
CREATE FUNCTION public.intensivtrainer_save_state(target_user uuid,expected_revision bigint,next_payload jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles p JOIN auth.users u ON u.id=p.id WHERE p.id=target_user AND p.role='admin'
 AND NOT coalesce(p.is_suspended,false) AND u.email_confirmed_at IS NOT NULL
 AND coalesce(u.raw_user_meta_data->>'is_suspended','false')<>'true'
 AND EXISTS(SELECT 1 FROM workbook_memberships m WHERE m.user_id=p.id
  AND m.book_key='aspekte-neu-b2-intensivtrainer' AND m.active)) THEN RETURN false; END IF;
 RETURN public.workbook_save_state(target_user,'aspekte-neu-b2-intensivtrainer',expected_revision,next_payload);
END;
$$;
REVOKE ALL ON FUNCTION public.intensivtrainer_save_state(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.intensivtrainer_save_state(uuid,bigint,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
