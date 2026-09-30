import { supabase } from '../../service/supabase/supabase_client'

export async function sign_up_user({ email, password, display_name }) {
  return supabase.auth.signUp({ email, password, options: { data: { full_name: display_name } } })
}

export async function sign_in_user({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function sign_out_user() {
  return supabase.auth.signOut()
}

export async function reset_user_password(email) {
  return supabase.auth.resetPasswordForEmail(email)
}

export async function get_user_session() {
  return supabase.auth.getSession()
}
