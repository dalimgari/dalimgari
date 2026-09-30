const allowed_tables = [
  'website_information',
  'admin_information',
  'pages',
  'posts',
  'albums',
  'media',
  'customization_settings',
  'system_settings',
  'translation_settings'
]

export function ensure_table(table_name) {
  if (!allowed_tables.includes(table_name)) throw new Error('table_not_allowed')
}

export { allowed_tables }
