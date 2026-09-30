import { supabase } from '../../service/supabase/supabase_client'
import { ensure_table } from './admin_table_guard'

export async function sync_input_fields({
  table_name,
  key_field,
  value_field,
  fields,
  values = {},
  build_value = (value) => value,
  extra = {}
}) {
  ensure_table(table_name)
  const operations = []

  for (const field of fields) {
    const key = Array.isArray(field) ? field[0] : field
    const value = values[key]
    const normalized = typeof value === 'string' ? value.trim() : value

    if (normalized === '' || normalized === null || normalized === undefined) {
      operations.push(supabase.from(table_name).delete().eq(key_field, key))
      continue
    }

    operations.push(supabase.from(table_name).upsert({
      [key_field]: key,
      [value_field]: build_value(normalized, key),
      ...extra
    }, { onConflict: key_field }))
  }

  const results = await Promise.all(operations)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
  return true
}
