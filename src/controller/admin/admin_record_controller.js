import { supabase } from '../../service/supabase/supabase_client'

export async function delete_record(table_name, id_field, record_id) {
  const allowed_tables = ['website_information', 'admin_information', 'pages', 'posts', 'customization_settings', 'system_settings']
  if (!allowed_tables.includes(table_name)) throw new Error('table_not_allowed')
  const { error } = await supabase.from(table_name).delete().eq(id_field, record_id)
  if (error) throw error
  return true
}
