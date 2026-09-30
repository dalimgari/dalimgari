import { supabase } from '../../service/supabase/supabase_client'

export async function has_admin_permission(permission_key) {
  const { data, error } = await supabase.rpc('current_user_has_permission', { required_permission: permission_key })
  if (error) return false
  return Boolean(data)
}

export async function get_admin_permissions() {
  const { data: session_data } = await supabase.auth.getSession()
  const profile_id = session_data.session?.user?.id
  if (!profile_id) return []

  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id, roles(role_key, role_permissions(permissions(permission_key)))')
    .eq('profile_id', profile_id)

  if (error) throw error
  return data ?? []
}
