import { supabase } from '../lib/supabase'

export async function getSecurityTestStatus() {
  const { data, error } = await supabase.rpc('get_latest_security_test')
  if (error) throw error
  return data || { status: 'unknown', summary: {}, checks: [] }
}

export async function runSecurityTest() {
  const { data, error } = await supabase.functions.invoke('admin-security-test', { body: {} })
  if (error) throw error
  return data || { status: 'unknown', summary: {}, checks: [] }
}
