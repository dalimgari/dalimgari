import { supabase } from '../lib/supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function listManagedUsers() {
  const client = requireSupabase()
  const { data, error } = await client.from('profiles').select('profile_id,email,phone,display_name,bio,link,profile_image_url,is_active,is_protected,user_roles!user_roles_profile_id_fkey(role_id,roles(role_key,role_name))').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listRoles() {
  const client = requireSupabase()
  const { data, error } = await client.from('roles').select('role_id,role_key,role_name').eq('is_active', true).order('role_name')
  if (error) throw error
  return data ?? []
}

export async function assignUserRole(profileId, roleId) {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')
  const { data, error } = await client.from('user_roles').upsert({ profile_id: profileId, role_id: roleId, assigned_by: userData.user.id }, { onConflict: 'profile_id' }).select('*').single()
  if (error) throw error
  return data
}

export async function inviteUser(email, displayName = '') {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('invite-user', { body: { email, displayName } })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.user
}
