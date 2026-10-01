import { supabase } from '../lib/supabase'

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getAuthUser() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export function subscribeToAuthChanges(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}
