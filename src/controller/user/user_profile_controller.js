import { supabase } from '../../service/supabase/supabase_client'

export async function get_current_user_profile() {
  const { data: session_data, error: session_error } = await supabase.auth.getSession()
  if (session_error) throw session_error
  const user_id = session_data.session?.user?.id
  if (!user_id) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('profile_id', user_id).maybeSingle()
  if (error) throw error
  return data
}

export async function update_current_user_profile(profile_data) {
  const { data: session_data, error: session_error } = await supabase.auth.getSession()
  if (session_error) throw session_error
  const user_id = session_data.session?.user?.id
  if (!user_id) return null

  const { data, error } = await supabase.from('profiles').update(profile_data).eq('profile_id', user_id).select().single()
  if (error) throw error
  return data
}
