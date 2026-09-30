import { supabase } from '../../service/supabase/supabase_client'

export async function create_database_backup(backup_name = '') {
  const { data, error } = await supabase.rpc('create_database_backup', { p_backup_name: backup_name || null })
  if (error) throw error
  return data
}

export async function list_database_backups() {
  const { data, error } = await supabase.from('backup_records').select('*').order('created_at', { ascending: false }).limit(3)
  if (error) throw error
  return data ?? []
}

export async function restore_database_backup(backup_record_id) {
  const { data, error } = await supabase.rpc('restore_database_backup', { p_backup_record_id: backup_record_id })
  if (error) throw error
  return data
}
