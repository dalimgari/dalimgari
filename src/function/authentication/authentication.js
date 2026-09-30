import { supabase } from '../../service/supabase/client.js'

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithPhone(phone, password) {
  return supabase.auth.signInWithPassword({ phone, password })
}

export async function signUpWithEmail(email, password, metadata = {}) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  })
}

export async function signUpWithPhone(phone, password, metadata = {}) {
  return supabase.auth.signUp({
    phone,
    password,
    options: { data: metadata },
  })
}

export async function signInWithGoogle(redirectTo) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: redirectTo ? { redirectTo } : undefined,
  })
}

export async function requestPasswordReset(email, redirectTo) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(password) {
  return supabase.auth.updateUser({ password })
}

export async function getCurrentSession() {
  return supabase.auth.getSession()
}

export async function signOut() {
  return supabase.auth.signOut()
}
