import { supabase } from '../lib/supabase'
import { appPath } from '../lib/routes'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function signUpWithPassword(email, password, displayName = '') {
  const client = requireSupabase()
  const redirectTo = new URL(appPath('/login'), window.location.origin).toString()
  const metadata = displayName ? { full_name: displayName } : undefined
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      ...(metadata ? { data: metadata } : {}),
    },
  })
  if (error) throw error
  return data
}

export async function signInWithPassword(email, password) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithOAuth(provider = 'google') {
  const client = requireSupabase()
  // OAuth must return to the same clean dashboard route used by password login.
  // Role verification happens in RoleRoute after the Auth session is restored.
  const redirectTo = new URL(appPath('/dashboard'), window.location.origin).toString()
  const { data, error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo } })
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
