import { supabase } from '../../service/supabase/supabase_client'
import { ensure_table } from './admin_table_guard'

export async function generate_next_key(table_name, key_field, prefix) {
  ensure_table(table_name)
  const { data, error } = await supabase.from(table_name).select(key_field)
  if (error) throw error

  let max_number = 0
  for (const row of data ?? []) {
    const key = String(row[key_field] ?? '')
    if (!key.toLowerCase().startsWith(prefix.toLowerCase())) continue
    const suffix = key.slice(prefix.length)
    if (!/^\d+$/.test(suffix)) continue
    max_number = Math.max(max_number, Number(suffix))
  }

  return prefix + (max_number + 1)
}
