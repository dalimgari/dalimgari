import { supabase } from '../../service/supabase/supabase_client'
import { ensure_table } from './admin_table_guard'

export async function delete_record(table_name, id_field, record_id) {
  ensure_table(table_name)
  const { error } = await supabase.from(table_name).delete().eq(id_field, record_id)
  if (error) throw error
  return true
}
