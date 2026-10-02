do $$
declare
  v_manager uuid; v_moderator uuid; v_editor uuid; v_user uuid;
  v_dashboard uuid; v_content uuid; v_media uuid; v_homepage uuid; v_sidebar uuid; v_settings uuid;
begin
  select role_id into v_manager from public.roles where lower(role_key)='manager' limit 1;
  select role_id into v_moderator from public.roles where lower(role_key)='moderator' limit 1;
  select role_id into v_editor from public.roles where lower(role_key)='editor' limit 1;
  select role_id into v_user from public.roles where lower(role_key)='user' limit 1;
  select permission_id into v_dashboard from public.permissions where permission_key='dashboard_view' limit 1;
  select permission_id into v_content from public.permissions where permission_key='content_manage' limit 1;
  select permission_id into v_media from public.permissions where permission_key='media_manage' limit 1;
  select permission_id into v_homepage from public.permissions where permission_key='homepage_manage' limit 1;
  select permission_id into v_sidebar from public.permissions where permission_key='sidebar_manage' limit 1;
  select permission_id into v_settings from public.permissions where permission_key='settings_manage' limit 1;
  if v_manager is not null then
    insert into public.role_permissions(role_id, permission_id) values (v_manager,v_dashboard),(v_manager,v_content),(v_manager,v_media),(v_manager,v_homepage),(v_manager,v_sidebar),(v_manager,v_settings) on conflict do nothing;
  end if;
  if v_moderator is not null then
    insert into public.role_permissions(role_id, permission_id) values (v_moderator,v_dashboard),(v_moderator,v_content),(v_moderator,v_media) on conflict do nothing;
  end if;
  if v_editor is not null then
    insert into public.role_permissions(role_id, permission_id) values (v_editor,v_dashboard),(v_editor,v_content) on conflict do nothing;
  end if;
  if v_user is not null then
    insert into public.role_permissions(role_id, permission_id) values (v_user,v_dashboard) on conflict do nothing;
  end if;
end $$;