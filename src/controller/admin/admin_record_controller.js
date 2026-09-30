import { supabase } from '../../service/supabase/supabase_client'

const allowed_tables = [
  'website_information',
  'admin_information',
  'pages',
  'posts',
  'customization_settings',
  'system_settings'
]

function ensure_table(table_name) {
  if (!allowed_tables.includes(table_name)) throw new Error('table_not_allowed')
}

export async function delete_record(table_name, id_field, record_id) {
  ensure_table(table_name)
  const { error } = await supabase.from(table_name).delete().eq(id_field, record_id)
  if (error) throw error
  return true
}

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
      operations.push(
        supabase.from(table_name).delete().eq(key_field, key)
      )
      continue
    }

    operations.push(
      supabase.from(table_name).upsert(
        {
          [key_field]: key,
          [value_field]: build_value(normalized, key),
          ...extra
        },
        { onConflict: key_field }
      )
    )
  }

  const results = await Promise.all(operations)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error

  return true
}
