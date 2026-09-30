import { supabase } from '../../service/supabase/supabase_client'

export async function get_user_permissions() {
  const { data: session_data, error: session_error } = await supabase.auth.getSession()
  if (session_error) throw session_error
  const user_id = session_data.session?.user?.id
  if (!user_id) return []

  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(role_permissions(permissions(permission_key)))')
    .eq('profile_id', user_id)

  if (error) throw error
  return (data ?? []).flatMap((item) =>
    (item.roles?.role_permissions ?? []).map((role_permission) => role_permission.permissions?.permission_key).filter(Boolean)
  )
}

export async function user_has_permission(permission_key) {
  const { data, error } = await supabase.rpc('has_permission', { required_permission: permission_key })
  if (error) return false
  return Boolean(data)
}

export async function get_user_role(profile_id) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id, roles(role_key, role_name, description)')
    .eq('profile_id', profile_id)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.roles ?? null
}

export async function get_current_user_role() {
  const { data: session_data, error: session_error } = await supabase.auth.getSession()
  if (session_error) throw session_error
  if (!session_data.session?.user) return null
  return get_user_role(session_data.session.user.id)
}
