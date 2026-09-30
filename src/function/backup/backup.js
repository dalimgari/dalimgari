import { supabase_client } from '../../service/supabase/supabase_client.js'

export async function create_backup() {
  const { data, error } = await supabase_client.rpc('create_system_backup')
  if (error) throw error
  return data
}

export async function list_backups() {
  const { data, error } = await supabase_client
    .from('backup_records')
    .select('backup_record_id, backup_key, backup_type, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) throw error
  return data ?? []
}

export async function restore_backup(backup_record_id) {
  const { data, error } = await supabase_client.rpc('restore_system_backup', {
    target_backup_id: backup_record_id
  })

  if (error) throw error
  return data
}
