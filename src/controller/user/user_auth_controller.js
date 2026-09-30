import { supabase } from '../../service/supabase/supabase_client'

export async function sign_up_user({ email, password, display_name }) {
  return supabase.auth.signUp({ email, password, options: { data: { full_name: display_name } } })
}

export async function sign_in_user({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function sign_in_with_google() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + import.meta.env.BASE_URL }
  })
}

export async function sign_in_with_phone(phone) {
  return supabase.auth.signInWithOtp({ phone })
}

export async function verify_phone_otp(phone, token) {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' })
}

export async function sign_out_user() {
  return supabase.auth.signOut()
}

export async function reset_user_password(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + import.meta.env.BASE_URL + 'user/reset-password'
  })
}

export async function get_user_session() {
  return supabase.auth.getSession()
}
