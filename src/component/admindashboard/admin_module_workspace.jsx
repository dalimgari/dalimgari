import { createElement, useEffect, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'
import { delete_record } from '../../controller/admin/admin_record_controller'

const module_config = {
  websiteinformation: { table: 'website_information', id: 'website_information_id', label: 'Website Information', fields: ['information_key', 'information_value', 'is_active'] },
  admininfo: { table: 'admin_information', id: 'admin_information_id', label: 'Admin Info', fields: ['profile_id', 'information_value', 'social_links', 'other_links'] },
  pagemanagement: { table: 'pages', id: 'page_id', label: 'Page Management', fields: ['page_key', 'page_title', 'page_slug', 'html_content', 'seo_data', 'display_order', 'is_visible', 'status'] },
  postmanagement: { table: 'posts', id: 'post_id', label: 'Post Management', fields: ['post_key', 'caption', 'album_id', 'status', 'is_visible', 'seo_data'] },
  customization: { table: 'customization_settings', id: 'customization_setting_id', label: 'Customization', fields: ['setting_key', 'setting_value', 'is_active'] },
  system: { table: 'system_settings', id: 'system_setting_id', label: 'System', fields: ['setting_key', 'setting_value', 'is_active'] },
  analysisinfo: { table: 'analytics_visits', id: 'analytics_visit_id', label: 'Analysis Info', fields: [] },
  usermanagement: { table: 'profiles', id: 'profile_id', label: 'User Management', fields: ['display_name', 'email', 'phone', 'profile_image_url', 'bio', 'social_links', 'other_links', 'is_active'] }
}

export function admin_module_workspace({ module_key }) {
  const config = module_config[module_key]
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState({})
  const [editing_id, set_editing_id] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    if (!config) return
    const { data, error } = await supabase.from(config.table).select('*').order('created_at', { ascending: false }).limit(100)
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }

  useEffect(() => { load() }, [module_key])

  async function save(event) {
    event.preventDefault()
    const payload = { ...form }
    const query = editing_id ? supabase.from(config.table).update(payload).eq(config.id, editing_id) : supabase.from(config.table).insert(payload)
    const { error } = await query
    set_message(error ? error.message : 'Saved')
    if (!error) { set_form({}); set_editing_id(null); load() }
  }

  async function remove(id) {
    try { await delete_record(config.table, config.id, id); set_message('Deleted'); load() } catch (error) { set_message(error.message) }
  }

  if (!config) return createElement('section', null, 'Module unavailable')

  return createElement('section', { className: 'admin-module-workspace' },
    createElement('header', null, createElement('h2', null, config.label), createElement('span', null, message)),
    config.fields.length ? createElement('form', { onSubmit: save },
      config.fields.map((field) => createElement('label', { key: field }, field, createElement('input', { value: form[field] ?? '', onChange: (event) => set_form({ ...form, [field]: event.target.value }) }))),
      createElement('button', { type: 'submit' }, editing_id ? 'Update' : 'Create'),
      createElement('button', { type: 'button', onClick: () => { set_form({}); set_editing_id(null) } }, 'Clear')
    ) : null,
    createElement('div', null, rows.map((row) => createElement('article', { key: row[config.id] },
      createElement('span', null, row.display_name ?? row.information_key ?? row.page_key ?? row.post_key ?? row.setting_key ?? row.visited_at ?? row[config.id]),
      createElement('button', { type: 'button', onClick: () => { set_editing_id(row[config.id]); set_form(Object.fromEntries(config.fields.map((field) => [field, row[field] ?? '']))) } }, 'Edit'),
      config.fields.length ? createElement('button', { type: 'button', onClick: () => remove(row[config.id]) }, 'Delete') : null
    )))
  )
}
