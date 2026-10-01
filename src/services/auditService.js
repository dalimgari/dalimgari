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
