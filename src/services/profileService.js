import { supabase } from '../lib/supabase'

export async function getCurrentUser() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function getCurrentProfile() {
  if (!supabase) throw new Error('Supabase is not configured')
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}
