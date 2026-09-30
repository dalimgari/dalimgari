import { createElement, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'
import { delete_record, sync_input_fields } from '../../controller/admin/admin_record_controller'

const footer_fields = [['footer_copyright', 'Footer Copyright']]

const village_fields = [
  ['village_name', 'গ্রামের নাম'],
  ['village_slogan', 'গ্রামের স্লোগান'],
  ['village_description', 'গ্রামের বর্ণনা'],
  ['district', 'জেলা'],
  ['upazila', 'উপজেলা'],
  ['union', 'ইউনিয়ন'],
  ['post_office', 'পোস্ট অফিস'],
  ['postal_code', 'পোস্টাল কোড'],
  ['contact_phone', 'যোগাযোগের ফোন'],
  ['contact_email', 'যোগাযোগের ইমেইল'],
]

const roles = [
  { key: 'user', label: 'User' },
  { key: 'editor', label: 'Editor' },
  { key: 'moderator', label: 'Moderator' },
  { key: 'manager', label: 'Manager' },
  { key: 'admin', label: 'Admin' }
]

function localized(value, language = 'bn') {
  if (!value) return ''
  if (typeof value === 'object') return value[language] ?? value.bn ?? value.en ?? ''
  return String(value)
}

function json_value(value, fallback = {}) {
  try {
    return JSON.parse(value || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function input({ label, value, on_change, type = 'text', placeholder = '', disabled = false }) {
  return createElement('label', { className: 'admin-form-field' },
    createElement('span', null, label),
    createElement('input', {
      type, value: value ?? '', placeholder, disabled,
      onChange: (event) => on_change(event.target.value)
    })
  )
}

function textarea({ label, value, on_change, placeholder = '', rows = 6 }) {
  return createElement('label', { className: 'admin-form-field' },
    createElement('span', null, label),
    createElement('textarea', {
      value: value ?? '', placeholder, rows,
      onChange: (event) => on_change(event.target.value)
    })
  )
}

function checkbox({ label, checked, on_change, disabled = false }) {
  return createElement('label', { className: 'admin-form-check' },
    createElement('input', { type: 'checkbox', checked: Boolean(checked), disabled, onChange: (event) => on_change(event.target.checked) }),
    createElement('span', null, label)
  )
}

function select({ label, value, on_change, options, disabled = false }) {
  return createElement('label', { className: 'admin-form-field' },
    createElement('span', null, label),
    createElement('select', { value: value ?? '', disabled, onChange: (event) => on_change(event.target.value) },
      options.map((option) => createElement('option', { key: option.value, value: option.value }, option.label))
    )
  )
}

function panel_header(title, message) {
  return createElement('header', { className: 'admin-module-header' },
    createElement('h2', null, title),
    message && createElement('p', { role: 'status' }, message)
  )
}

function village_information_workspace() {
  const [values, set_values] = useState({})
  const [message, set_message] = useState('')

  async function load() {
    const { data, error } = await supabase.from('website_information').select('*').order('information_key')
    if (error) return set_message(error.message)
    const next = {}
    for (const row of data ?? []) next[row.information_key] = localized(row.information_value)
    set_values(next)
  }

  useEffect(() => { load() }, [])

  async function save() {
    try {
      await sync_input_fields({
        table_name: 'website_information',
        key_field: 'information_key',
        value_field: 'information_value',
        fields: village_fields,
        values,
        build_value: (value) => ({ bn: value, en: value }),
        extra: { is_active: true }
      })
      set_message('Village information saved')
      await load()
    } catch (error) {
      set_message(error.message)
    }
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Village Information', message),
    createElement('div', { className: 'admin-form-grid' },
      village_fields.map(([key, label]) => input({
        key, label, value: values[key],
        on_change: (value) => set_values({ ...values, [key]: value }),
        type: key.includes('email') ? 'email' : 'text'
      }))
    ),
    createElement('div', { className: 'admin-actions' },
      createElement('button', { type: 'button', onClick: save }, 'Save Village Information')
    ),
    createElement('details', null,
      createElement('summary', null, 'Existing records'),
      (rows ?? []).map((row) => createElement('div', { key: row.website_information_id, className: 'admin-record-row' },
        createElement('span', null, row.information_key),
        createElement('button', { type: 'button', onClick: () => remove(row.information_key) }, 'Delete')
      ))
    )
  )
}

function normalize_admin_url(value) {
  const input = String(value ?? '').trim()
  if (!input) return ''
  if (!/^https?:\/\//i.test(input)) return `https://${input}`
  try { return new URL(input).toString() } catch { return '' }
}

function admin_link_icon(url) {
  try {
    const domain = new URL(normalize_admin_url(url)).hostname.replace(/^www\./i, '')
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
  } catch {
    return ''
  }
}

function admin_information_workspace() {
  const [rows, set_rows] = useState([])
  const [selected, set_selected] = useState('')
  const [form, set_form] = useState({ name: '', email: '', phone: '', image: '', bio: '', admin_links: [] })
  const [message, set_message] = useState('')

  async function load() {
    const { data, error } = await supabase.from('admin_information').select('*').order('updated_at', { ascending: false })
    if (error) return set_message(error.message)
    set_rows(data ?? [])
    if (!selected && data?.[0]) {
      set_selected(data[0].admin_information_id)
      const row = data[0]
      const info = row.information_value ?? {}
      set_form({
        name: info.admin_name ?? '', email: info.admin_email ?? '', phone: info.admin_phone ?? '',
        image: info.admin_profile_image ?? '', bio: info.admin_bio ?? '',
        admin_links: Array.isArray(row.other_links?.admin_sidebar_links) ? row.other_links.admin_sidebar_links : []
      })
    }
  }

  useEffect(() => { load() }, [])

  function select_row(row) {
    const info = row.information_value ?? {}
    set_selected(row.admin_information_id)
    set_form({
      name: info.admin_name ?? '', email: info.admin_email ?? '', phone: info.admin_phone ?? '',
      image: info.admin_profile_image ?? '', bio: info.admin_bio ?? '',
      facebook: row.social_links?.facebook ?? '', youtube: row.social_links?.youtube ?? '',
      other: row.other_links?.website ?? ''
    })
  }

  async function save() {
    if (!selected) return set_message('Select an admin information record')
    const row = rows.find((item) => item.admin_information_id === selected)
    if (!row) return
    const { error } = await supabase.from('admin_information').update({
      information_value: {
        admin_name: form.name, admin_email: form.email, admin_phone: form.phone,
        admin_profile_image: form.image, admin_bio: form.bio
      },
      social_links: row.social_links ?? {},
      other_links: { ...(row.other_links ?? {}), admin_sidebar_links: form.admin_links.filter((link) => link.title?.trim() && link.url?.trim()).map((link) => ({ title: link.title.trim(), url: normalize_admin_url(link.url) })) },
      updated_at: new Date().toISOString()
    }).eq('admin_information_id', selected)
    set_message(error ? error.message : 'Admin information saved')
    if (!error) await load()
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Admin Information', message),
    createElement('div', { className: 'admin-record-list' },
      rows.map((row) => createElement('button', { key: row.admin_information_id, type: 'button', onClick: () => select_row(row), className: selected === row.admin_information_id ? 'is-selected' : '' },
        localized(row.information_value?.admin_name) || row.profile_id
      ))
    ),
    selected && createElement('div', { className: 'admin-form-grid' },
      input({ label: 'Admin Name', value: form.name, on_change: (value) => set_form({ ...form, name: value }) }),
      input({ label: 'Admin Email', value: form.email, on_change: (value) => set_form({ ...form, email: value }), type: 'email' }),
      input({ label: 'Admin Phone', value: form.phone, on_change: (value) => set_form({ ...form, phone: value }) }),
      input({ label: 'Profile Image URL', value: form.image, on_change: (value) => set_form({ ...form, image: value }) }),
      textarea({ label: 'Admin Bio', value: form.bio, on_change: (value) => set_form({ ...form, bio: value }), rows: 4 }),
      createElement('div', { className: 'admin-links-editor' },
        createElement('div', { className: 'admin-links-editor-header' },
          createElement('strong', null, 'Admin Sidebar Links'),
          createElement('button', { type: 'button', onClick: () => set_form({ ...form, admin_links: [...form.admin_links, { title: '', url: '' }] }) }, 'Add Link')
        ),
        form.admin_links.map((link, index) => createElement('div', { key: index, className: 'admin-link-editor-row' },
          createElement('img', { src: admin_link_icon(link.url), alt: '', width: 32, height: 32 }),
          input({ label: 'Title', value: link.title, on_change: (value) => set_form({ ...form, admin_links: form.admin_links.map((item, i) => i === index ? { ...item, title: value } : item) }) }),
          input({ label: 'URL', value: link.url, on_change: (value) => set_form({ ...form, admin_links: form.admin_links.map((item, i) => i === index ? { ...item, url: value } : item) }), placeholder: 'https://example.com' }),
          createElement('button', { type: 'button', onClick: () => set_form({ ...form, admin_links: form.admin_links.filter((_, i) => i !== index) }), 'aria-label': 'Remove link' }, '×')
        ))
      )
    ),
    selected && createElement('button', { type: 'button', onClick: save }, 'Save Admin Information')
  )
}

function pages_workspace() {
  const blank = { page_key: '', title_bn: '', title_en: '', slug: '', content: '', seo_title: '', seo_description: '', canonical: '', robots: 'index,follow', order: 0, visible: true, status: 'draft' }
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState(blank)
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    const { data, error } = await supabase.from('pages').select('*').order('display_order').order('created_at', { ascending: false })
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }
  useEffect(() => { load() }, [])

  function edit(row) {
    set_editing(row.page_id)
    set_form({
      page_key: row.page_key, title_bn: localized(row.page_title, 'bn'), title_en: localized(row.page_title, 'en'),
      slug: row.page_slug, content: row.html_content, seo_title: localized(row.seo_data?.title, 'bn'),
      seo_description: localized(row.seo_data?.description, 'bn'), canonical: row.seo_data?.canonical_url ?? '',
      robots: row.seo_data?.robots ?? 'index,follow', order: row.display_order ?? 0,
      visible: row.is_visible, status: row.status
    })
  }

  async function save(event) {
    event.preventDefault()
    if (!form.page_key || !form.title_bn || !form.slug) return set_message('Page key, Bengali title and slug are required')
    const payload = {
      page_key: form.page_key.trim(), page_title: { bn: form.title_bn, en: form.title_en || form.title_bn },
      page_slug: form.slug.toLowerCase().replace(/^\/+|\/+$/g, ''), html_content: form.content,
      seo_data: { title: { bn: form.seo_title, en: form.seo_title }, description: { bn: form.seo_description, en: form.seo_description }, canonical_url: form.canonical, robots: form.robots },
      display_order: Number(form.order) || 0, is_visible: form.visible, status: form.status
    }
    const query = editing ? supabase.from('pages').update(payload).eq('page_id', editing) : supabase.from('pages').insert(payload)
    const { error } = await query
    set_message(error ? error.message : editing ? 'Page updated' : 'Page created')
    if (!error) { set_form(blank); set_editing(null); await load() }
  }

  async function remove(id) {
    if (!window.confirm('এই পেজটি মুছে ফেলবেন?')) return
    const { error } = await delete_record('pages', 'page_id', id)
    set_message(error ? error.message : 'Page deleted')
    if (!error) await load()
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Page Management', message),
    createElement('form', { onSubmit: save },
      createElement('div', { className: 'admin-form-grid' },
        input({ label: 'Page Key', value: form.page_key, on_change: (value) => set_form({ ...form, page_key: value }) }),
        input({ label: 'Page Title (বাংলা)', value: form.title_bn, on_change: (value) => set_form({ ...form, title_bn: value }) }),
        input({ label: 'Page Title (English)', value: form.title_en, on_change: (value) => set_form({ ...form, title_en: value }) }),
        input({ label: 'Slug', value: form.slug, on_change: (value) => set_form({ ...form, slug: value }) }),
        input({ label: 'SEO Title', value: form.seo_title, on_change: (value) => set_form({ ...form, seo_title: value }) }),
        input({ label: 'SEO Description', value: form.seo_description, on_change: (value) => set_form({ ...form, seo_description: value }) }),
        input({ label: 'Canonical URL', value: form.canonical, on_change: (value) => set_form({ ...form, canonical: value }) }),
        input({ label: 'Robots', value: form.robots, on_change: (value) => set_form({ ...form, robots: value }) }),
        input({ label: 'Display Order', value: form.order, on_change: (value) => set_form({ ...form, order: value }), type: 'number' }),
        checkbox({ label: 'Visible', checked: form.visible, on_change: (value) => set_form({ ...form, visible: value }) }),
        select({ label: 'Status', value: form.status, on_change: (value) => set_form({ ...form, status: value }), options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }] })
      ),
      textarea({ label: 'Page Content (HTML)', value: form.content, on_change: (value) => set_form({ ...form, content: value }), rows: 12 }),
      createElement('div', { className: 'admin-actions' },
        createElement('button', { type: 'submit' }, editing ? 'Update Page' : 'Create Page'),
        editing && createElement('button', { type: 'button', onClick: () => { set_editing(null); set_form(blank) } }, 'Cancel')
      )
    ),
    createElement('div', { className: 'admin-record-list' },
      rows.map((row) => createElement('article', { key: row.page_id, className: 'admin-record-row' },
        createElement('strong', null, localized(row.page_title)),
        createElement('span', null, '/' + row.page_slug),
        createElement('span', null, row.status),
        createElement('button', { type: 'button', onClick: () => edit(row) }, 'Edit'),
        createElement('button', { type: 'button', onClick: () => remove(row.page_id) }, 'Delete')
      ))
    )
  )
}

function albums_workspace() {
  const blank = { key: '', title_bn: '', title_en: '', description: '', visible: true }
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState(blank)
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')
  async function load() {
    const { data, error } = await supabase.from('albums').select('*').order('created_at', { ascending: false })
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }
  useEffect(() => { load() }, [])
  async function save(event) {
    event.preventDefault()
    const payload = { album_key: form.key, album_title: { bn: form.title_bn, en: form.title_en || form.title_bn }, description: { bn: form.description, en: form.description }, is_visible: form.visible }
    const query = editing ? supabase.from('albums').update(payload).eq('album_id', editing) : supabase.from('albums').insert(payload)
    const { error } = await query
    set_message(error ? error.message : 'Saved')
    if (!error) { set_form(blank); set_editing(null); await load() }
  }
  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Albums', message),
    createElement('form', { onSubmit: save }, createElement('div', { className: 'admin-form-grid' },
      input({ label: 'Album Key', value: form.key, on_change: (value) => set_form({ ...form, key: value }) }),
      input({ label: 'Album Title (বাংলা)', value: form.title_bn, on_change: (value) => set_form({ ...form, title_bn: value }) }),
      input({ label: 'Album Title (English)', value: form.title_en, on_change: (value) => set_form({ ...form, title_en: value }) }),
      textarea({ label: 'Description', value: form.description, on_change: (value) => set_form({ ...form, description: value }), rows: 4 }),
      checkbox({ label: 'Visible', checked: form.visible, on_change: (value) => set_form({ ...form, visible: value }) })
    ), createElement('button', { type: 'submit' }, editing ? 'Update Album' : 'Create Album')),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => createElement('article', { key: row.album_id, className: 'admin-record-row' },
      createElement('strong', null, localized(row.album_title)), createElement('span', null, row.album_key),
      createElement('button', { type: 'button', onClick: () => { set_editing(row.album_id); set_form({ key: row.album_key, title_bn: localized(row.album_title, 'bn'), title_en: localized(row.album_title, 'en'), description: localized(row.description), visible: row.is_visible }) } }, 'Edit'),
      createElement('button', { type: 'button', onClick: async () => { if (!window.confirm('Delete album?')) return; const { error } = await delete_record('albums', 'album_id', row.album_id); set_message(error ? error.message : 'Deleted'); if (!error) load() } }, 'Delete')
    )))
  )
}

function media_workspace() {
  const [rows, set_rows] = useState([])
  const [albums, set_albums] = useState([])
  const [form, set_form] = useState({ key: '', method: 'url', url: '', album_id: '', visible: true })
  const [file, set_file] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    const [{ data: media, error }, { data: album_rows }] = await Promise.all([
      supabase.from('media').select('*').order('created_at', { ascending: false }),
      supabase.from('albums').select('album_id,album_title').order('created_at')
    ])
    if (error) set_message(error.message)
    set_rows(media ?? [])
    set_albums(album_rows ?? [])
  }
  useEffect(() => { load() }, [])

  async function save(event) {
    event.preventDefault()
    let url = form.url
    let storage_path = null
    let file_name = file?.name ?? null
    let mime_type = file?.type ?? null
    let file_size = file?.size ?? null
    if (form.method !== 'url') {
      if (!file) return set_message('Select a file first')
      storage_path = `admin/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: upload_error } = await supabase.storage.from('global_media').upload(storage_path, file, { upsert: false })
      if (upload_error) return set_message(upload_error.message)
      url = supabase.storage.from('global_media').getPublicUrl(storage_path).data.publicUrl
    }
    const payload = { media_key: form.key, media_method: form.method, file_name, mime_type, file_size, storage_path, media_url: url, album_id: form.album_id || null, is_visible: form.visible }
    const { error } = await supabase.from('media').insert(payload)
    set_message(error ? error.message : 'Media added')
    if (!error) { set_form({ key: '', method: 'url', url: '', album_id: '', visible: true }); set_file(null); await load() }
  }

  async function remove(row) {
    if (!window.confirm('Delete this media?')) return
    if (row.storage_path) await supabase.storage.from('global_media').remove([row.storage_path])
    const { error } = await delete_record('media', 'media_id', row.media_id)
    set_message(error ? error.message : 'Deleted')
    if (!error) await load()
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Media Manager', message),
    createElement('form', { onSubmit: save }, createElement('div', { className: 'admin-form-grid' },
      input({ label: 'Media Key', value: form.key, on_change: (value) => set_form({ ...form, key: value }) }),
      select({ label: 'Method', value: form.method, on_change: (value) => set_form({ ...form, method: value }), options: [{ value: 'url', label: 'URL' }, { value: 'upload', label: 'Upload' }, { value: 'select_file', label: 'Select File' }] }),
      form.method === 'url' ? input({ label: 'Media URL', value: form.url, on_change: (value) => set_form({ ...form, url: value }) }) : createElement('label', { className: 'admin-form-field' }, createElement('span', null, 'File'), createElement('input', { type: 'file', onChange: (event) => set_file(event.target.files?.[0] ?? null) })),
      select({ label: 'Album', value: form.album_id, on_change: (value) => set_form({ ...form, album_id: value }), options: [{ value: '', label: 'No album' }, ...albums.map((row) => ({ value: row.album_id, label: localized(row.album_title) }))] }),
      checkbox({ label: 'Visible', checked: form.visible, on_change: (value) => set_form({ ...form, visible: value }) })
    ), createElement('button', { type: 'submit' }, 'Add Media')),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => createElement('article', { key: row.media_id, className: 'admin-record-row' },
      createElement('strong', null, row.media_key), createElement('span', null, row.file_name || row.media_url || ''),
      createElement('button', { type: 'button', onClick: () => remove(row) }, 'Delete')
    )))
  )
}

function posts_workspace() {
  const blank = { key: '', caption_bn: '', caption_en: '', album_id: '', status: 'draft', visible: true, seo_title: '', seo_description: '' }
  const [rows, set_rows] = useState([])
  const [albums, set_albums] = useState([])
  const [media, set_media] = useState([])
  const [form, set_form] = useState(blank)
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    const [{ data: posts, error }, { data: album_rows }, { data: media_rows }] = await Promise.all([
      supabase.from('posts').select('*,albums(album_title),post_media(media_id,display_order)').order('created_at', { ascending: false }),
      supabase.from('albums').select('album_id,album_title').order('created_at'),
      supabase.from('media').select('media_id,media_key,media_url').order('created_at', { ascending: false })
    ])
    if (error) set_message(error.message)
    set_rows(posts ?? [])
    set_albums(album_rows ?? [])
    set_media(media_rows ?? [])
  }
  useEffect(() => { load() }, [])

  async function save(event) {
    event.preventDefault()
    const payload = { post_key: form.key, caption: { bn: form.caption_bn, en: form.caption_en || form.caption_bn }, album_id: form.album_id || null, status: form.status, is_visible: form.visible, seo_data: { title: { bn: form.seo_title, en: form.seo_title }, description: { bn: form.seo_description, en: form.seo_description } }, published_at: form.status === 'published' ? new Date().toISOString() : null }
    const query = editing ? supabase.from('posts').update(payload).eq('post_id', editing) : supabase.from('posts').insert(payload).select('post_id').single()
    const { data, error } = await query
    if (error) return set_message(error.message)
    const post_id = editing || data.post_id
    const media_keys = window.prompt('Optional media IDs, comma separated', '') || ''
    if (media_keys) {
      await supabase.from('post_media').delete().eq('post_id', post_id)
      const ids = media_keys.split(',').map((item) => item.trim()).filter(Boolean)
      if (ids.length) await supabase.from('post_media').insert(ids.map((media_id, index) => ({ post_id, media_id, display_order: index })))
    }
    set_message(editing ? 'Post updated' : 'Post created')
    set_form(blank); set_editing(null); await load()
  }

  async function remove(id) {
    if (!window.confirm('এই পোস্টটি মুছে ফেলবেন?')) return
    const { error } = await delete_record('posts', 'post_id', id)
    set_message(error ? error.message : 'Deleted')
    if (!error) await load()
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Post Management', message),
    createElement('form', { onSubmit: save }, createElement('div', { className: 'admin-form-grid' },
      input({ label: 'Post Key', value: form.key, on_change: (value) => set_form({ ...form, key: value }) }),
      input({ label: 'Caption (বাংলা)', value: form.caption_bn, on_change: (value) => set_form({ ...form, caption_bn: value }) }),
      input({ label: 'Caption (English)', value: form.caption_en, on_change: (value) => set_form({ ...form, caption_en: value }) }),
      select({ label: 'Album', value: form.album_id, on_change: (value) => set_form({ ...form, album_id: value }), options: [{ value: '', label: 'No album' }, ...albums.map((row) => ({ value: row.album_id, label: localized(row.album_title) }))] }),
      select({ label: 'Status', value: form.status, on_change: (value) => set_form({ ...form, status: value }), options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }] }),
      checkbox({ label: 'Visible', checked: form.visible, on_change: (value) => set_form({ ...form, visible: value }) }),
      input({ label: 'SEO Title', value: form.seo_title, on_change: (value) => set_form({ ...form, seo_title: value }) }),
      input({ label: 'SEO Description', value: form.seo_description, on_change: (value) => set_form({ ...form, seo_description: value }) })
    ), createElement('button', { type: 'submit' }, editing ? 'Update Post' : 'Create Post')),
    createElement('p', null, `Available media: ${media.map((item) => item.media_id).join(', ')}`),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => createElement('article', { key: row.post_id, className: 'admin-record-row' },
      createElement('strong', null, localized(row.caption)), createElement('span', null, row.status),
      createElement('button', { type: 'button', onClick: () => { set_editing(row.post_id); set_form({ key: row.post_key, caption_bn: localized(row.caption, 'bn'), caption_en: localized(row.caption, 'en'), album_id: row.album_id ?? '', status: row.status, visible: row.is_visible, seo_title: localized(row.seo_data?.title, 'bn'), seo_description: localized(row.seo_data?.description, 'bn') }) } }, 'Edit'),
      createElement('button', { type: 'button', onClick: () => remove(row.post_id) }, 'Delete')
    )))
  )
}

function settings_workspace({ table, title, permission_hint }) {
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState({ key: '', value: '', active: true })
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }
  useEffect(() => { load() }, [table])

  async function save(event) {
    event.preventDefault()
    const payload = { setting_key: form.key, setting_value: json_value(form.value, { value: form.value }), is_active: form.active }
    const query = editing ? supabase.from(table).update(payload).eq(table === 'system_settings' ? 'system_setting_id' : 'customization_setting_id', editing) : supabase.from(table).insert(payload)
    const { error } = await query
    set_message(error ? error.message : 'Saved')
    if (!error) { set_form({ key: '', value: '', active: true }); set_editing(null); await load() }
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header(title, message),
    createElement('p', null, permission_hint),
    createElement('form', { onSubmit: save }, createElement('div', { className: 'admin-form-grid' },
      input({ label: 'Setting Key', value: form.key, on_change: (value) => set_form({ ...form, key: value }) }),
      textarea({ label: 'Setting Value (JSON বা plain text)', value: form.value, on_change: (value) => set_form({ ...form, value: value }), placeholder: '{"value":"..."}', rows: 5 }),
      checkbox({ label: 'Active', checked: form.active, on_change: (value) => set_form({ ...form, active: value }) })
    ), createElement('button', { type: 'submit' }, editing ? 'Update Setting' : 'Create Setting')),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => createElement('article', { key: row[table === 'system_settings' ? 'system_setting_id' : 'customization_setting_id'], className: 'admin-record-row' },
      createElement('strong', null, row.setting_key), createElement('span', null, JSON.stringify(row.setting_value)),
      createElement('button', { type: 'button', onClick: () => { set_editing(row[table === 'system_settings' ? 'system_setting_id' : 'customization_setting_id']); set_form({ key: row.setting_key, value: JSON.stringify(row.setting_value), active: row.is_active }) } }, 'Edit'),
      createElement('button', { type: 'button', onClick: async () => { if (!window.confirm('Delete setting?')) return; const { error } = await delete_record(table, table === 'system_settings' ? 'system_setting_id' : 'customization_setting_id', row[table === 'system_settings' ? 'system_setting_id' : 'customization_setting_id']); set_message(error ? error.message : 'Deleted'); if (!error) load() } }, 'Delete')
    )))
  )
}


function translation_workspace() {
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState({ key: 'default', source: 'bn', languages: 'bn,en', active: true })
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    const { data, error } = await supabase.from('translation_settings').select('*').order('created_at', { ascending: false })
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function save(event) {
    event.preventDefault()
    const payload = {
      setting_key: form.key,
      source_language: form.source,
      supported_languages: form.languages.split(',').map((item) => item.trim()).filter(Boolean),
      is_active: form.active
    }
    const query = editing
      ? supabase.from('translation_settings').update(payload).eq('translation_setting_id', editing)
      : supabase.from('translation_settings').insert(payload)
    const { error } = await query
    set_message(error ? error.message : 'Translation settings saved')
    if (!error) { set_form({ key: 'default', source: 'bn', languages: 'bn,en', active: true }); set_editing(null); await load() }
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Translation Settings', message),
    createElement('form', { onSubmit: save },
      createElement('div', { className: 'admin-form-grid' },
        input({ label: 'Setting Key', value: form.key, on_change: (value) => set_form({ ...form, key: value }) }),
        input({ label: 'Source Language', value: form.source, on_change: (value) => set_form({ ...form, source: value }) }),
        input({ label: 'Supported Languages (comma separated)', value: form.languages, on_change: (value) => set_form({ ...form, languages: value }) }),
        checkbox({ label: 'Active', checked: form.active, on_change: (value) => set_form({ ...form, active: value }) })
      ),
      createElement('button', { type: 'submit' }, editing ? 'Update Translation Settings' : 'Create Translation Settings')
    ),
    createElement('div', { className: 'admin-record-list' },
      rows.map((row) => createElement('article', { key: row.translation_setting_id, className: 'admin-record-row' },
        createElement('strong', null, row.setting_key),
        createElement('span', null, row.source_language),
        createElement('span', null, (row.supported_languages ?? []).join(', ')),
        createElement('button', { type: 'button', onClick: () => {
          set_editing(row.translation_setting_id)
          set_form({ key: row.setting_key, source: row.source_language, languages: (row.supported_languages ?? []).join(','), active: row.is_active })
        } }, 'Edit'),
        createElement('button', { type: 'button', onClick: async () => {
          if (!window.confirm('Delete translation setting?')) return
          const { error } = await delete_record('translation_settings', 'translation_setting_id', row.translation_setting_id)
          set_message(error ? error.message : 'Deleted')
          if (!error) load()
        } }, 'Delete')
      ))
    )
  )
}

function seo_workspace() {
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState({ entity_type: 'website', entity_id: '', title_bn: '', title_en: '', description_bn: '', description_en: '', slug: '', canonical: '', robots: 'index,follow', active: true })
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')
  async function load() {
    const { data, error } = await supabase.from('seo_settings').select('*').order('created_at', { ascending: false })
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }
  useEffect(() => { load() }, [])
  async function save(event) {
    event.preventDefault()
    const payload = {
      entity_type: form.entity_type, entity_id: form.entity_id || null,
      seo_title: { bn: form.title_bn, en: form.title_en || form.title_bn },
      seo_description: { bn: form.description_bn, en: form.description_en || form.description_bn },
      seo_slug: form.slug || null, canonical_url: form.canonical || null, robots_directive: form.robots, is_active: form.active
    }
    const query = editing ? supabase.from('seo_settings').update(payload).eq('seo_setting_id', editing) : supabase.from('seo_settings').insert(payload)
    const { error } = await query
    set_message(error ? error.message : 'SEO saved')
    if (!error) { set_form({ entity_type: 'website', entity_id: '', title_bn: '', title_en: '', description_bn: '', description_en: '', slug: '', canonical: '', robots: 'index,follow', active: true }); set_editing(null); load() }
  }
  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('SEO Manager', message),
    createElement('form', { onSubmit: save }, createElement('div', { className: 'admin-form-grid' },
      input({ label: 'Entity Type', value: form.entity_type, on_change: (value) => set_form({ ...form, entity_type: value }) }),
      input({ label: 'Entity ID (optional)', value: form.entity_id, on_change: (value) => set_form({ ...form, entity_id: value }) }),
      input({ label: 'SEO Title (বাংলা)', value: form.title_bn, on_change: (value) => set_form({ ...form, title_bn: value }) }),
      input({ label: 'SEO Title (English)', value: form.title_en, on_change: (value) => set_form({ ...form, title_en: value }) }),
      input({ label: 'SEO Description (বাংলা)', value: form.description_bn, on_change: (value) => set_form({ ...form, description_bn: value }) }),
      input({ label: 'SEO Description (English)', value: form.description_en, on_change: (value) => set_form({ ...form, description_en: value }) }),
      input({ label: 'SEO Slug', value: form.slug, on_change: (value) => set_form({ ...form, slug: value }) }),
      input({ label: 'Canonical URL', value: form.canonical, on_change: (value) => set_form({ ...form, canonical: value }) }),
      input({ label: 'Robots Directive', value: form.robots, on_change: (value) => set_form({ ...form, robots: value }) }),
      checkbox({ label: 'Active', checked: form.active, on_change: (value) => set_form({ ...form, active: value }) })
    ), createElement('button', { type: 'submit' }, editing ? 'Update SEO' : 'Create SEO')),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => createElement('article', { key: row.seo_setting_id, className: 'admin-record-row' },
      createElement('strong', null, localized(row.seo_title)), createElement('span', null, row.entity_type),
      createElement('button', { type: 'button', onClick: () => { set_editing(row.seo_setting_id); set_form({ entity_type: row.entity_type, entity_id: row.entity_id ?? '', title_bn: localized(row.seo_title, 'bn'), title_en: localized(row.seo_title, 'en'), description_bn: localized(row.seo_description, 'bn'), description_en: localized(row.seo_description, 'en'), slug: row.seo_slug ?? '', canonical: row.canonical_url ?? '', robots: row.robots_directive ?? 'index,follow', active: row.is_active }) } }, 'Edit'),
      createElement('button', { type: 'button', onClick: async () => { if (!window.confirm('Delete SEO setting?')) return; const { error } = await delete_record('seo_settings', 'seo_setting_id', row.seo_setting_id); set_message(error ? error.message : 'Deleted'); if (!error) load() } }, 'Delete')
    )))
  )
}

function users_workspace() {
  const blank = { display_name: '', email: '', phone: '', password: '', role_key: 'user', is_active: true }
  const [rows, set_rows] = useState([])
  const [form, set_form] = useState(blank)
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    const { data, error } = await supabase.from('profiles').select('profile_id,email,display_name,phone,account_type,is_active,is_super_admin,user_roles(role_id,roles(role_key,role_name))').order('created_at', { ascending: false })
    if (error) set_message(error.message)
    set_rows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function call(action, profile_id = null) {
    const { data, error } = await supabase.functions.invoke('manage-account', { body: { action, profile_id, ...form } })
    if (error) return set_message(error.message)
    if (data?.error) return set_message(data.error)
    set_message(action === 'create' ? 'Account created' : action === 'update' ? 'Account updated' : 'Account deleted')
    set_form(blank); set_editing(null); await load()
  }

  function edit(row) {
    set_editing(row.profile_id)
    set_form({
      display_name: row.display_name ?? '', email: row.email ?? '', phone: row.phone ?? '',
      password: '', role_key: row.user_roles?.[0]?.roles?.role_key ?? 'user', is_active: row.is_active
    })
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('User & Staff Accounts', message),
    createElement('p', null, 'Super Admin is protected. Other User, Editor, Moderator, Manager and Admin accounts can be created, edited and deleted here.'),
    createElement('form', { onSubmit: (event) => { event.preventDefault(); call(editing ? 'update' : 'create', editing) } },
      createElement('div', { className: 'admin-form-grid' },
        input({ label: 'Name', value: form.display_name, on_change: (value) => set_form({ ...form, display_name: value }) }),
        input({ label: 'Email', value: form.email, on_change: (value) => set_form({ ...form, email: value }), type: 'email' }),
        input({ label: editing ? 'New Password (optional)' : 'Password', value: form.password, on_change: (value) => set_form({ ...form, password: value }), type: 'password' }),
        input({ label: 'Phone', value: form.phone, on_change: (value) => set_form({ ...form, phone: value }) }),
        select({ label: 'Role', value: form.role_key, on_change: (value) => set_form({ ...form, role_key: value }), options: roles }),
        checkbox({ label: 'Active', checked: form.is_active, on_change: (value) => set_form({ ...form, is_active: value }) })
      ),
      createElement('div', { className: 'admin-actions' },
        createElement('button', { type: 'submit' }, editing ? 'Update Account' : 'Create Account'),
        editing && createElement('button', { type: 'button', onClick: () => { set_editing(null); set_form(blank) } }, 'Cancel')
      )
    ),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => {
      const role = row.user_roles?.[0]?.roles?.role_key ?? row.account_type
      return createElement('article', { key: row.profile_id, className: 'admin-record-row' },
        createElement('strong', null, row.display_name || row.email),
        createElement('span', null, role),
        createElement('span', null, row.is_active ? 'Active' : 'Inactive'),
        row.is_super_admin
          ? createElement('strong', null, 'Protected Super Admin')
          : createElement('div', null,
              createElement('button', { type: 'button', onClick: () => edit(row) }, 'Edit'),
              createElement('button', { type: 'button', onClick: () => { if (window.confirm('এই account মুছে ফেলবেন?')) call('delete', row.profile_id) } }, 'Delete')
            )
      )
    }))
  )
}

function analytics_workspace() {
  const [stats, set_stats] = useState({ visits: 0, visitors: 0, pages: [] })
  const [message, set_message] = useState('')
  useEffect(() => {
    Promise.all([
      supabase.from('analytics_visits').select('visitor_key,page_path,visited_at').order('visited_at', { ascending: false }).limit(1000),
      supabase.from('pages').select('page_id', { count: 'exact', head: true }),
      supabase.from('posts').select('post_id', { count: 'exact', head: true })
    ]).then(([visits, pages, posts]) => {
      if (visits.error) return set_message(visits.error.message)
      const unique = new Set((visits.data ?? []).map((row) => row.visitor_key)).size
      set_stats({ visits: visits.data?.length ?? 0, visitors: unique, pages: [pages.count ?? 0, posts.count ?? 0] })
    }).catch((error) => set_message(error.message))
  }, [])
  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Analytics', message),
    createElement('div', { className: 'admin-stat-grid' },
      createElement('strong', null, `Visits: ${stats.visits}`),
      createElement('strong', null, `Unique Visitors: ${stats.visitors}`),
      createElement('strong', null, `Pages: ${stats.pages[0] ?? 0}`),
      createElement('strong', null, `Posts: ${stats.pages[1] ?? 0}`)
    )
  )
}

function audit_workspace() {
  const [rows, set_rows] = useState([])
  const [message, set_message] = useState('')
  useEffect(() => {
    supabase.from('audit_logs').select('*,profiles(display_name,email)').order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (error) set_message(error.message); set_rows(data ?? []) })
  }, [])
  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Audit Logs', message),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => createElement('article', { key: row.audit_log_id, className: 'admin-record-row' },
      createElement('strong', null, row.action_key), createElement('span', null, row.entity_type || ''), createElement('time', null, new Date(row.created_at).toLocaleString()), createElement('pre', null, JSON.stringify(row.action_data))
    )))
  )
}

export function admin_module_workspace({ module_key }) {
  if (module_key === 'websiteinformation') return createElement(village_information_workspace)
  if (module_key === 'admininfo') return createElement(admin_information_workspace)
  if (module_key === 'pagemanagement') return createElement(pages_workspace)
  if (module_key === 'postmanagement') return createElement(posts_workspace)
  if (module_key === 'albums') return createElement(albums_workspace)
  if (module_key === 'media') return createElement(media_workspace)
  if (module_key === 'usermanagement') return createElement(users_workspace)
  if (module_key === 'seo') return createElement(seo_workspace)
  if (module_key === 'analysisinfo') return createElement(analytics_workspace)
  if (module_key === 'audit') return createElement(audit_workspace)
  if (module_key === 'customization') return createElement(settings_workspace, { table: 'customization_settings', title: 'Customization', permission_hint: 'Theme, appearance and public UI settings.' })
  if (module_key === 'translation') return createElement(translation_workspace)
  if (module_key === 'system') return createElement(settings_workspace, { table: 'system_settings', title: 'System Settings', permission_hint: 'System-level settings. Backup and recovery is shown beside this module.' })
  return createElement('section', null, 'Module unavailable')
}