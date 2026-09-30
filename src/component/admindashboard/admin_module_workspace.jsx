import { createElement, useEffect, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'
import { delete_record } from '../../controller/admin/admin_record_controller'

const module_config = {
  websiteinformation: { table: 'website_information', id: 'website_information_id', label: 'Website Information', fields: ['information_key', 'information_value', 'is_active'], allow_delete: true },
  admininfo: { table: 'admin_information', id: 'admin_information_id', label: 'Admin Info', fields: ['profile_id', 'information_value', 'social_links', 'other_links'], allow_delete: true },
  pagemanagement: { table: 'pages', id: 'page_id', label: 'Page Management', fields: ['page_key', 'page_title', 'page_slug', 'html_content', 'seo_data', 'display_order', 'is_visible', 'status'], allow_delete: true },
  postmanagement: { table: 'posts', id: 'post_id', label: 'Post Management', fields: ['post_key', 'caption', 'album_id', 'status', 'is_visible', 'seo_data'], allow_delete: true },
  customization: { table: 'customization_settings', id: 'customization_setting_id', label: 'Customization', fields: ['setting_key', 'setting_value', 'is_active'], allow_delete: true },
  system: { table: 'system_settings', id: 'system_setting_id', label: 'System', fields: ['setting_key', 'setting_value', 'is_active'], allow_delete: true },
  analysisinfo: { table: 'analytics_visits', id: 'analytics_visit_id', label: 'Analysis Info', fields: [], allow_delete: false }
}

const roles = [
  { key: 'user', label: 'User' },
  { key: 'editor', label: 'Editor' },
  { key: 'moderator', label: 'Moderator' },
  { key: 'manager', label: 'Manager' },
  { key: 'admin', label: 'Admin' }
]

function field_value(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function parse_value(field, value) {
  if (['information_value', 'social_links', 'other_links', 'page_title', 'seo_data', 'caption', 'setting_value', 'bio'].includes(field)) {
    try { return JSON.parse(value || '{}') } catch { return {} }
  }
  if (field === 'display_order') return Number(value || 0)
  if (field === 'is_active' || field === 'is_visible') return value === true || value === 'true'
  return value || null
}

function user_management_workspace() {
  const [rows, set_rows] = useState([])
  const [message, set_message] = useState('')
  const [saving_id, set_saving_id] = useState(null)

  async function load() {
    const { data, error } = await supabase.rpc('get_manageable_users')
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function assign_role(profile_id, role_key) {
    set_saving_id(profile_id)
    const { error } = await supabase.rpc('assign_user_role', {
      target_profile_id: profile_id,
      target_role_key: role_key
    })
    set_message(error ? error.message : 'Role updated')
    if (!error) await load()
    set_saving_id(null)
  }

  const user_cards = rows.map((row) => {
    const role_options = roles.map((role) =>
      createElement('option', { key: role.key, value: role.key }, role.label)
    )

    const role_select = createElement('select', {
      value: row.role_key || 'user',
      disabled: saving_id === row.profile_id,
      onChange: (event) => assign_role(row.profile_id, event.target.value)
    }, role_options)

    return createElement('article', { key: row.profile_id },
      createElement('strong', null, row.display_name || row.email || row.profile_id),
      createElement('span', null, row.email || row.phone || ''),
      createElement('label', null, 'Role', role_select),
      createElement('small', null, row.is_active ? 'Active' : 'Inactive')
    )
  })

  return createElement('section', { className: 'admin-module-workspace' },
    createElement('header', null,
      createElement('h2', null, 'User Management'),
      createElement('span', null, message)
    ),
    createElement('p', null, 'Accounts are created in Supabase Authentication. Assign one role here; permissions follow the selected role.'),
    createElement('div', { className: 'admin-user-list' }, user_cards)
  )
}

export function admin_module_workspace({ module_key }) {
  if (module_key === 'usermanagement') return createElement(user_management_workspace)

  const config = module_config[module_key]
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState({})
  const [editing_id, set_editing_id] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    if (!config) return
    let query = supabase.from(config.table).select('*')
    const order_field = config.table === 'analytics_visits' ? 'visited_at' : 'created_at'
    query = query.order(order_field, { ascending: false }).limit(100)
    const { data, error } = await query
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }

  useEffect(() => { load() }, [module_key])

  async function save(event) {
    event.preventDefault()
    const payload = Object.fromEntries(config.fields.map((field) => [field, parse_value(field, form[field])]))
    const query = editing_id
      ? supabase.from(config.table).update(payload).eq(config.id, editing_id)
      : supabase.from(config.table).insert(payload)
    const { error } = await query
    set_message(error ? error.message : 'Saved')
    if (!error) {
      set_form({})
      set_editing_id(null)
      load()
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this record? This action cannot be undone.')) return
    try {
      await delete_record(config.table, config.id, id)
      set_message('Deleted')
      load()
    } catch (error) {
      set_message(error.message)
    }
  }

  if (!config) return createElement('section', null, 'Module unavailable')

  const field_labels = {
    information_key: 'Information key',
    information_value: 'Information value',
    profile_id: 'Profile ID',
    social_links: 'Social links',
    other_links: 'Other links',
    page_key: 'Page key',
    page_title: 'Page title',
    page_slug: 'Page slug',
    html_content: 'Page content',
    seo_data: 'SEO data',
    display_order: 'Display order',
    is_visible: 'Visible',
    status: 'Status',
    post_key: 'Post key',
    caption: 'Caption',
    album_id: 'Album',
    setting_key: 'Setting key',
    setting_value: 'Setting value',
    is_active: 'Active'
  }

  const json_fields = ['information_value', 'social_links', 'other_links', 'page_title', 'seo_data', 'caption', 'setting_value']
  const boolean_fields = ['is_active', 'is_visible']

  const form_element = config.fields.length
    ? createElement('form', { onSubmit: save },
        config.fields.map((field) => {
          const label = field_labels[field] ?? field.replaceAll('_', ' ')
          const type = boolean_fields.includes(field) ? 'checkbox' : 'text'
          const control = type === 'checkbox'
            ? createElement('input', {
                type,
                checked: form[field] === true || form[field] === 'true',
                onChange: (event) => set_form({ ...form, [field]: event.target.checked })
              })
            : createElement('input', {
                type,
                value: form[field] ?? '',
                placeholder: json_fields.includes(field) ? '{"bn":"","en":""}' : '',
                onChange: (event) => set_form({ ...form, [field]: event.target.value })
              })
          return createElement('label', { key: field }, label, control)
        }),
        createElement('button', { type: 'submit' }, editing_id ? 'Update' : 'Create'),
        createElement('button', {
          type: 'button',
          onClick: () => {
            set_form({})
            set_editing_id(null)
          }
        }, 'Clear')
      )
    : null

  const row_elements = rows.map((row) =>
    createElement('article', { key: row[config.id] },
      createElement('span', null,
        row.display_name ?? row.information_key ?? row.page_key ?? row.post_key ?? row.setting_key ?? row.visited_at ?? row[config.id]
      ),
      config.fields.length
        ? createElement('button', {
            type: 'button',
            onClick: () => {
              set_editing_id(row[config.id])
              set_form(Object.fromEntries(config.fields.map((field) => [field, field_value(row[field])])))
            }
          }, 'Edit')
        : null,
      config.allow_delete
        ? createElement('button', { type: 'button', onClick: () => remove(row[config.id]) }, 'Delete')
        : null
    )
  )

  return createElement('section', { className: 'admin-module-workspace' },
    createElement('header', null,
      createElement('h2', null, config.label),
      createElement('span', null, message)
    ),
    form_element,
    createElement('div', null, row_elements)
  )
}
