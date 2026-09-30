import { createElement, useEffect, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'

const blank = { title: '', domain: '' }
function normalize_domain(value) { let input = String(value ?? '').trim().toLowerCase(); if (!input) return ''; if (!/^https?:\/\//i.test(input)) input = `https://${input}`; try { const url = new URL(input); return url.hostname.replace(/^www\./i, '').replace(/\.$/, '') } catch { return '' } }
function normalized_url(domain) { return `https://${domain}` }
function icon_url(domain) { return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` }
function panel_header(title, message) { return createElement('header', { className: 'admin-module-header' }, createElement('h2', null, title), message && createElement('p', { role: 'status' }, message)) }
function field(label, value, on_change, placeholder) { return createElement('label', { className: 'admin-form-field' }, createElement('span', null, label), createElement('input', { value: value ?? '', placeholder, onChange: (event) => on_change(event.target.value) })) }

export function link_management_workspace() {
  const [rows, set_rows] = useState([])
  const [icons, set_icons] = useState([])
  const [form, set_form] = useState(blank)
  const [editing, set_editing] = useState(null)
  const [form_open, set_form_open] = useState(false)
  const [message, set_message] = useState('')
  const [saving, set_saving] = useState(false)

  async function load() {
    const [links_result, icons_result] = await Promise.all([
      supabase.from('managed_links').select('link_id,title,domain,url,icon_domain,created_at,updated_at').order('created_at', { ascending: true }),
      supabase.from('domain_icons').select('domain,icon_url').order('domain')
    ])
    if (links_result.error) return set_message(links_result.error.message)
    if (icons_result.error) return set_message(icons_result.error.message)
    set_rows(links_result.data ?? [])
    set_icons(icons_result.data ?? [])
  }
  useEffect(() => { load() }, [])

  function start_add() { set_editing(null); set_form(blank); set_form_open(true); set_message('') }
  function start_edit(row) { set_editing(row.link_id); set_form({ title: row.title ?? '', domain: row.domain ?? '' }); set_form_open(true); set_message('') }
  function close_form() { set_editing(null); set_form(blank); set_form_open(false) }

  async function save(event) {
    event.preventDefault()
    const title = form.title.trim()
    const domain = normalize_domain(form.domain)
    if (!title) return set_message('টাইটেল দিন')
    if (!domain) return set_message('সঠিক ডোমেইন দিন')
    set_saving(true)
    const icon_result = await supabase.from('domain_icons').upsert({ domain, icon_url: icon_url(domain), updated_at: new Date().toISOString() }, { onConflict: 'domain' })
    if (icon_result.error) { set_saving(false); return set_message(icon_result.error.message) }
    const payload = { title, domain, url: normalized_url(domain), icon_domain: domain, updated_at: new Date().toISOString() }
    const result = editing ? await supabase.from('managed_links').update(payload).eq('link_id', editing) : await supabase.from('managed_links').insert(payload)
    set_saving(false)
    if (result.error) return set_message(result.error.message)
    set_message(editing ? 'লিঙ্ক আপডেট হয়েছে' : 'লিঙ্ক যোগ হয়েছে')
    close_form()
    await load()
  }

  async function remove(id) {
    if (!window.confirm('এই লিঙ্কটি মুছে ফেলবেন?')) return
    const { error } = await supabase.from('managed_links').delete().eq('link_id', id)
    set_message(error ? error.message : 'লিঙ্ক মুছে ফেলা হয়েছে')
    if (!error) await load()
  }

  function icon_for(domain) { return icons.find((item) => item.domain === domain)?.icon_url ?? icon_url(domain) }

  return createElement('section', { className: 'admin-module-workspace link-management-workspace' },
    panel_header('Link Management', message),
    createElement('div', { className: 'link-management-toolbar' }, createElement('button', { type: 'button', onClick: start_add }, 'Add Link')),
    rows.length === 0 ? createElement('div', { className: 'link-management-empty' }, 'এখনও কোনো লিঙ্ক যোগ করা হয়নি.') : createElement('div', { className: 'link-management-list' }, rows.map((row) =>
      createElement('article', { key: row.link_id, className: 'link-management-card' },
        createElement('img', { src: icon_for(row.icon_domain), alt: '', width: 40, height: 40, loading: 'lazy' }),
        createElement('div', { className: 'link-management-card-copy' }, createElement('strong', null, row.title), createElement('span', null, row.domain)),
        createElement('div', { className: 'link-management-card-actions' },
          createElement('a', { href: row.url, target: '_blank', rel: 'noopener noreferrer' }, 'Open'),
          createElement('button', { type: 'button', onClick: () => start_edit(row) }, 'Edit'),
          createElement('button', { type: 'button', onClick: () => remove(row.link_id) }, 'Delete')
        )
      )
    )),
    form_open && createElement('div', { className: 'link-management-modal-layer', role: 'presentation' },
      createElement('div', { className: 'link-management-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': editing ? 'Edit Link' : 'Add Link' },
        createElement('div', { className: 'link-management-modal-header' }, createElement('h3', null, editing ? 'Edit Link' : 'Add Link'), createElement('button', { type: 'button', onClick: close_form, 'aria-label': 'Close' }, '×')),
        createElement('form', { onSubmit: save },
          field('Title', form.title, (value) => set_form({ ...form, title: value }), 'যেমন: Facebook'),
          field('Domain', form.domain, (value) => set_form({ ...form, domain: value }), 'example.com'),
          createElement('p', { className: 'link-management-help' }, 'https:// বা www না দিলেও সিস্টেম নিজে ঠিক করে নেবে।'),
          createElement('div', { className: 'admin-actions' }, createElement('button', { type: 'submit', disabled: saving }, saving ? 'Saving…' : editing ? 'Update Link' : 'Save Link'), createElement('button', { type: 'button', onClick: close_form }, 'Cancel'))
        )
      )
    )
  )
}
