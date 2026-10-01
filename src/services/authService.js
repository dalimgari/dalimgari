import { supabase } from '../lib/supabase'
import { appPath } from '../lib/routes'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function signInWithPassword(email, password) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function resetPasswordForEmail(email) {
  const client = requireSupabase()
  const redirectTo = new URL(appPath('/login'), window.location.origin).toString()
  const { data, error } = await client.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
  return data
}

export async function updatePassword(password) {
  const client = requireSupabase()
  const { data, error } = await client.auth.updateUser({ password })
  if (error) throw error
  return data
}

export async function signOut() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}
