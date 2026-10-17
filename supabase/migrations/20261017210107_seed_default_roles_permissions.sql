-- Additive, repeatable seed for the existing RBAC schema.
-- Does not assign any account an administrative role.
insert into public.roles (name, description)
values
  ('admin', 'Full application administration; grant only to explicitly trusted accounts.'),
  ('member', 'Signed-in community member with standard member permissions.'),
  ('guest', 'Unauthenticated visitor; public content remains governed by anon RLS policies.')
on conflict (name) do update
set description = excluded.description;

insert into public.permissions (name, description)
values
  ('content.view', 'View content allowed by row-level security.'),
  ('content.create', 'Create application content.'),
  ('content.edit', 'Edit application content.'),
  ('content.delete', 'Delete application content.'),
  ('users.manage', 'Manage member accounts.'),
  ('roles.manage', 'Manage roles and role assignments.'),
  ('settings.manage', 'Manage site settings and widgets.'),
  ('media.manage', 'Manage media library assets.'),
  ('recycle_bin.manage', 'Restore or permanently remove deleted records.')
on conflict (name) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'admin'
  and p.name in (
    'content.view', 'content.create', 'content.edit', 'content.delete',
    'users.manage', 'roles.manage', 'settings.manage', 'media.manage',
    'recycle_bin.manage'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.name = 'content.view'
where r.name in ('member', 'guest')
on conflict (role_id, permission_id) do nothing;
