import { supabase } from '../lib/supabase'

export async function createAuditLog({ actionKey, module, recordId = null, details = {}, ipAddress = null }) {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')

  const payload = {
    actor_profile_id: userData.user.id,
    action_key: actionKey,
    module,
    record_id: recordId,
    details,
    ip_address: ipAddress,
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function listAuditLogs(limit = 100) {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('audit_logs')
    .select('audit_log_id,action_key,module,record_id,details,created_at,profiles(display_name,email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
