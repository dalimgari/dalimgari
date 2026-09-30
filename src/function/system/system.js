import { supabase } from '../../service/supabase/supabase_client.js'

export async function get_system_settings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('system_setting_id, setting_key, setting_value, is_active')
    .eq('is_active', true)
    .order('setting_key')

  if (error) throw error
  return data ?? []
}

export async function create_backup_record(backup) {
  const { data, error } = await supabase
    .from('backup_records')
    .insert(backup)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function get_backup_records() {
  const { data, error } = await supabase
    .from('backup_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) throw error
  return data ?? []
}
