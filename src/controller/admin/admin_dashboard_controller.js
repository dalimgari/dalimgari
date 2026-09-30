import { supabase } from '../../service/supabase/supabase_client'

export async function get_current_admin() {
  const { data: session_data, error: session_error } = await supabase.auth.getSession()
  if (session_error) throw session_error
  const user = session_data.session?.user
  if (!user) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('profile_id', user.id).maybeSingle()
  if (error) throw error
  if (data?.account_type !== 'admin') return null
  return data
}

export async function sign_out_admin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
