-- 0006: las funciones de trigger no deben poder llamarse desde la API (/rest/v1/rpc/...).
-- Los triggers siguen funcionando: el permiso EXECUTE solo se revisa al crear el trigger.
-- Se dejan públicas a propósito: create_order, is_admin (la usan las políticas), like_state, toggle_like,
-- list_faq_questions y list_post_comments (las usa la web).
revoke execute on function public.handle_new_user()                    from public, anon, authenticated;
revoke execute on function public.handle_user_email_change()           from public, anon, authenticated;
revoke execute on function public.protect_profile_privileged_columns() from public, anon, authenticated;
revoke execute on function public.reject_interaction_spam()            from public, anon, authenticated;
