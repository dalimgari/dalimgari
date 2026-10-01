import { supabase } from '../lib/supabase'

export async function hasPermission(permissionKey) {
  if (!supabase) throw new Error('Supabase is not configured')
  if (!permissionKey) return false

  const { data, error } = await supabase.rpc('current_user_has_permission', {
    required_permission: permissionKey,
  })

  if (error) throw error
  return Boolean(data)
}
