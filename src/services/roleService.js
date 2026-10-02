import { supabase } from '../lib/supabase'

const SUPPORTED_ROLES = new Set(['admin', 'manager', 'editor', 'moderator', 'user'])

export async function getCurrentRole() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const user = authData.user
  if (!user) return null

  const { data, error } = await supabase
    .from('user_roles')
    .select('roles!inner(role_key,role_name,is_active)')
    .eq('profile_id', user.id)
    .eq('roles.is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  const role = data?.roles
  const roleKey = String(role?.role_key || '').toLowerCase()
  if (!SUPPORTED_ROLES.has(roleKey)) return null
  return { key: roleKey, name: role?.role_name || roleKey }
}

// /dashboard is the only public dashboard URL. The authenticated user's
// role is resolved after the request reaches this route.
export function dashboardPathForRole() {
  return '/dashboard'
}
