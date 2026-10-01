import { supabase } from '../lib/supabase'

export async function listManagedUsers() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('profiles').select('profile_id,email,phone,display_name,bio,link,profile_image_url,is_active,is_protected,user_roles(role_id,roles(role_key,role_name))').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listRoles() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('roles').select('role_id,role_key,role_name').eq('is_active', true).order('role_name')
  if (error) throw error
  return data ?? []
}

export async function assignUserRole(profileId, roleId) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')
  const { data, error } = await supabase.from('user_roles').upsert({ profile_id: profileId, role_id: roleId, assigned_by: userData.user.id }, { onConflict: 'profile_id' }).select('*').single()
  if (error) throw error
  return data
}
