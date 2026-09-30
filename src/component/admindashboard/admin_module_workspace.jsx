import { createElement, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'
import { delete_record, sync_input_fields } from '../../controller/admin/admin_record_controller'
import { global_media_uploader } from '../media/global_media_uploader'

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
  ['village_avatar', 'গ্রামের লোগো / অ্যাভাটার'],
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
      village_fields.map(([key, label]) => key === 'village_avatar'
        ? createElement(global_media_uploader, {
            key,
            label,
            accept: 'image/*',
            initial_url: values[key] ?? '',
            on_select: (media) => set_values({ ...values, village_avatar: media?.media_url ?? '' })
          })
        : input({
            key, label, value: values[key],
            on_change: (value) => set_values({ ...values, [key]: value }),
            type: key.includes('email') ? 'email' : 'text'
          }))
    ),
    createElement('div', { className: 'admin-actions' },
      createElement('button', { type: 'button', onClick: save }, 'Save Village Information')
    ),

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
      createElement(global_media_uploader, {
        label: 'Admin Avatar',
        accept: 'image/*',
        initial_url: form.image,
        key: `admin-avatar-${selected}`,
        on_select: (media) => set_form({ ...form, image: media?.media_url ?? '' })
      }),
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
  const blank = { title_bn: '', title_en: '', slug: '', content: '', seo_title: '', seo_description: '', canonical: '', robots: 'index,follow', order: 0, visible: true, status: 'draft' }
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
      title_bn: localized(row.page_title, 'bn'), title_en: localized(row.page_title, 'en'),
      slug: row.page_slug, content: row.html_content, seo_title: localized(row.seo_data?.title, 'bn'),
      seo_description: localized(row.seo_data?.description, 'bn'), canonical: row.seo_data?.canonical_url ?? '',
      robots: row.seo_data?.robots ?? 'index,follow', order: row.display_order ?? 0,
      visible: row.is_visible, status: row.status
    })
  }

  async function save(event) {
    event.preventDefault()
    if (!form.title_bn || !form.slug) return set_message('Bengali title and slug are required')
    const payload = {
      page_title: { bn: form.title_bn, en: form.title_en || form.title_bn },
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
  const blank = { title_bn: '', title_en: '', description: '', visible: true }
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
    const payload = { album_title: { bn: form.title_bn, en: form.title_en || form.title_bn }, description: { bn: form.description, en: form.description }, is_visible: form.visible }
    const query = editing ? supabase.from('albums').update(payload).eq('album_id', editing) : supabase.from('albums').insert(payload)
    const { error } = await query
    set_message(error ? error.message : 'Saved')
    if (!error) { set_form(blank); set_editing(null); await load() }
  }
  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Albums', message),
    createElement('form', { onSubmit: save }, createElement('div', { className: 'admin-form-grid' },
      input({ label: 'Album Title (বাংলা)', value: form.title_bn, on_change: (value) => set_form({ ...form, title_bn: value }) }),
      input({ label: 'Album Title (English)', value: form.title_en, on_change: (value) => set_form({ ...form, title_en: value }) }),
      textarea({ label: 'Description', value: form.description, on_change: (value) => set_form({ ...form, description: value }), rows: 4 }),
      checkbox({ label: 'Visible', checked: form.visible, on_change: (value) => set_form({ ...form, visible: value }) })
    ), createElement('button', { type: 'submit' }, editing ? 'Update Album' : 'Create Album')),
    createElement('div', { className: 'admin-record-list' }, rows.map((row) => createElement('article', { key: row.album_id, className: 'admin-record-row' },
      createElement('strong', null, localized(row.album_title)), createElement('button', { type: 'button', onClick: () => { set_editing(row.album_id); set_form({ title_bn: localized(row.album_title, 'bn'), title_en: localized(row.album_title, 'en'), description: localized(row.description), visible: row.is_visible }) } }, 'Edit'),
      createElement('button', { type: 'button', onClick: async () => { if (!window.confirm('Delete album?')) return; const { error } = await delete_record('albums', 'album_id', row.album_id); set_message(error ? error.message : 'Deleted'); if (!error) load() } }, 'Delete')
    )))
  )
}

function media_workspace() {
  const [rows, set_rows] = useState([])
  const [albums, set_albums] = useState([])
  const [form, set_form] = useState({ album_id: '', visible: true })
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

  async function apply_media_settings(media) {
    if (!media?.media_id) return
    const { error } = await supabase.from('media').update({
      album_id: form.album_id || null,
      is_visible: form.visible
    }).eq('media_id', media.media_id)
    if (error) set_message(error.message)
    else {
      set_message('Media added')
      await load()
    }
  }

  async function remove(row) {
    if (!window.confirm('এই মিডিয়াটি মুছে ফেলবেন?')) return
    if (row.storage_path) await supabase.storage.from('global_media').remove([row.storage_path])
    const { error } = await delete_record('media', 'media_id', row.media_id)
    set_message(error ? error.message : 'Deleted')
    if (!error) await load()
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Media Manager', message),
    createElement('div', { className: 'admin-form-grid' },
      createElement(global_media_uploader, {
        label: 'ছবি / ভিডিও / ফাইল',
        accept: 'image/*,video/*,.pdf',
        on_select: apply_media_settings
      }),
      select({
        label: 'Album',
        value: form.album_id,
        on_change: (value) => set_form({ ...form, album_id: value }),
        options: [{ value: '', label: 'No album' }, ...albums.map((row) => ({ value: row.album_id, label: localized(row.album_title) }))]
      }),
      checkbox({ label: 'Visible', checked: form.visible, on_change: (value) => set_form({ ...form, visible: value }) })
    ),
    createElement('div', { className: 'admin-record-list' },
      rows.map((row) => createElement('article', { key: row.media_id, className: 'admin-record-row' },
        createElement('strong', null, row.file_name || 'Media'),
        createElement('span', null, row.media_url || ''),
        createElement('button', { type: 'button', onClick: () => remove(row) }, 'Delete')
      ))
    )
  )
}

function posts_workspace() {
  const blank = { caption_bn: '', caption_en: '', album_id: '', status: 'draft', visible: true, seo_title: '', seo_description: '', media_ids: [] }
  const [rows, set_rows] = useState([])
  const [albums, set_albums] = useState([])
  const [form, set_form] = useState(blank)
  const [editing, set_editing] = useState(null)
  const [message, set_message] = useState('')

  async function load() {
    const [{ data: posts, error }, { data: album_rows }] = await Promise.all([
      supabase.from('posts').select('*,albums(album_title),post_media(media_id,display_order)').order('created_at', { ascending: false }),
      supabase.from('albums').select('album_id,album_title').order('created_at')
    ])
    if (error) set_message(error.message)
    set_rows(posts ?? [])
    set_albums(album_rows ?? [])
  }
  useEffect(() => { load() }, [])

  function add_media(media) {
    if (!media?.media_id) return
    set_form((current) => current.media_ids.includes(media.media_id)
      ? current
      : { ...current, media_ids: [...current.media_ids, media.media_id] })
  }

  async function save(event) {
    event.preventDefault()
    const payload = {
      caption: { bn: form.caption_bn, en: form.caption_en || form.caption_bn },
      album_id: form.album_id || null,
      status: form.status,
      is_visible: form.visible,
      seo_data: { title: { bn: form.seo_title, en: form.seo_title }, description: { bn: form.seo_description, en: form.seo_description } },
      published_at: form.status === 'published' ? new Date().toISOString() : null
    }
    const query = editing
      ? supabase.from('posts').update(payload).eq('post_id', editing)
      : supabase.from('posts').insert(payload).select('post_id').single()
    const { data, error } = await query
    if (error) return set_message(error.message)

    const post_id = editing || data.post_id
    await supabase.from('post_media').delete().eq('post_id', post_id)
    if (form.media_ids.length) {
      const { error: media_error } = await supabase.from('post_media').insert(
        form.media_ids.map((media_id, index) => ({ post_id, media_id, display_order: index }))
      )
      if (media_error) return set_message(media_error.message)
    }
    set_message(editing ? 'Post updated' : 'Post created')
    set_form(blank)
    set_editing(null)
    await load()
  }

  async function remove(id) {
    if (!window.confirm('এই পোস্টটি মুছে ফেলবেন?')) return
    const { error } = await delete_record('posts', 'post_id', id)
    set_message(error ? error.message : 'Deleted')
    if (!error) await load()
  }

  function edit(row) {
    set_editing(row.post_id)
    set_form({
      caption_bn: localized(row.caption, 'bn'),
      caption_en: localized(row.caption, 'en'),
      album_id: row.album_id ?? '',
      status: row.status,
      visible: row.is_visible,
      seo_title: localized(row.seo_data?.title, 'bn'),
      seo_description: localized(row.seo_data?.description, 'bn'),
      media_ids: (row.post_media ?? []).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)).map((item) => item.media_id)
    })
  }

  return createElement('section', { className: 'admin-module-workspace' },
    panel_header('Post Management', message),
    createElement('form', { onSubmit: save },
      createElement('div', { className: 'admin-form-grid' },
        input({ label: 'Caption (বাংলা)', value: form.caption_bn, on_change: (value) => set_form({ ...form, caption_bn: value }) }),
        input({ label: 'Caption (English)', value: form.caption_en, on_change: (value) => set_form({ ...form, caption_en: value }) }),
        select({ label: 'Album', value: form.album_id, on_change: (value) => set_form({ ...form, album_id: value }), options: [{ value: '', label: 'No album' }, ...albums.map((row) => ({ value: row.album_id, label: localized(row.album_title) }))] }),
        select({ label: 'Status', value: form.status, on_change: (value) => set_form({ ...form, status: value }), options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }] }),
        checkbox({ label: 'Visible', checked: form.visible, on_change: (value) => set_form({ ...form, visible: value }) }),
        input({ label: 'SEO Title', value: form.seo_title, on_change: (value) => set_form({ ...form, seo_title: value }) }),
        input({ label: 'SEO Description', value: form.seo_description, on_change: (value) => set_form({ ...form, seo_description: value }) })
      ),
      createElement(global_media_uploader, {
        label: 'Post Media',
        accept: 'image/*,video/*',
        multiple: true,
        on_select: add_media
      }),
      form.media_ids.length > 0 && createElement('p', null, `Selected media: ${form.media_ids.length}টি`),
      createElement('button', { type: 'submit' }, editing ? 'Update Post' : 'Create Post')
    ),
    createElement('div', { className: 'admin-record-list' },
      rows.map((row) => createElement('article', { key: row.post_id, className: 'admin-record-row' },
        createElement('strong', null, localized(row.caption)),
        createElement('span', null, row.status),
        createElement('button', { type: 'button', onClick: () => edit(row) }, 'Edit'),
        createElement('button', { type: 'button', onClick: () => remove(row.post_id) }, 'Delete')
      ))
    )
  )
}

}