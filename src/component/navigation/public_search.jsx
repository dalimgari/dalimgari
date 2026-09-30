import { createElement, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { get_localized_value } from '../../function/translation/language'

function text_value(value, language = 'bn') {
  if (!value) return ''
  if (typeof value === 'object') return get_localized_value(value, language) || ''
  return String(value)
}

function localized_values(value) {
  if (!value) return []
  if (typeof value === 'object') return [value.bn, value.en].filter(Boolean).map(String)
  return [String(value)]
}

function plain_text(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim()
}


function normalize_text(value) {
  return plain_text(value).toLocaleLowerCase().normalize('NFC')
}

function words(value) {
  return normalize_text(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
}

function match_score(value, query) {
  const text = normalize_text(value)
  const q = normalize_text(query)
  const q_words = words(q)
  if (!text || !q || !q_words.length) return 0

  const text_words = words(text)
  const exact_phrase = text === q
  const exact_words = q_words.filter((word) => text_words.includes(word)).length
  const prefix_words = q_words.filter((word) => text_words.some((item) => item.startsWith(word) && item !== word)).length
  const partial_words = q_words.filter((word) => word.length > 1 && text.includes(word)).length
  const phrase_inside = text.includes(q)

  let score = 0
  if (exact_phrase) score += 1000000
  if (exact_words === q_words.length) score += 100000
  if (phrase_inside && exact_words < q_words.length) score += 10000
  score += exact_words * 1000
  score += prefix_words * 100
  score += partial_words * 10
  return score
}

function is_visible_element(element) {
  if (!element || element.nodeType !== 1) return false
  if (element.closest('.public-search-layer')) return false
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function visible_element_text(element) {
  const values = [
    element.innerText,
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
    element.getAttribute('alt'),
    element.getAttribute('value')
  ]
  return plain_text(values.filter(Boolean).join(' '))
}

function visible_element_target(element) {
  const anchor = element.closest('a[href]')
  if (anchor) {
    const href = anchor.getAttribute('href')
    if (href && !href.startsWith('#') && !/^javascript:/i.test(href)) return href
  }
  const identified = element.closest('[id]')
  if (identified?.id) return window.location.pathname + '#' + identified.id
  const section = element.closest('section, article, main, footer')
  if (section?.id) return window.location.pathname + '#' + section.id
  return window.location.pathname || '/'
}

function get_visible_public_dom_entries() {
  if (typeof document === 'undefined') return []
  const elements = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,button,label,li,img,[title],[aria-label]'))
  const entries = []
  const seen = new Set()

  for (const element of elements) {
    if (!is_visible_element(element)) continue
    const value = visible_element_text(element)
    if (!value) continue
    const target = visible_element_target(element)
    const key = value + '|' + target
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ value, target })
  }

  return entries
}
function snippet(value, query) {
  const text = plain_text(value)
  if (!text) return ''
  const index = normalize_text(text).indexOf(normalize_text(query))
  if (index < 0) return text.slice(0, 180)
  const start = Math.max(0, index - 65)
  const end = Math.min(text.length, index + query.length + 115)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

function make_results({ information, pages, posts, dom_entries = [] }, language, query) {
  const q = query.trim()
  if (!q) return []
  const results = []
  const add = (type, title, description, to, key, searchable_text) => {
    const score = match_score(searchable_text, q)
    if (score > 0) results.push({ type, title, description, to, key, score })
  }
  for (const [index, entry] of dom_entries.entries()) {
    add('public', entry.value.slice(0, 90), snippet(entry.value, q), entry.target, 'dom-' + index + '-' + entry.target, entry.value)
  }

  const labels = { website_name: language === 'bn' ? 'ওয়েবসাইট' : 'Website', village_name: language === 'bn' ? 'গ্রামের নাম' : 'Village', village_slogan: language === 'bn' ? 'স্লোগান' : 'Slogan', village_description: language === 'bn' ? 'গ্রামের বর্ণনা' : 'Village description', district: language === 'bn' ? 'জেলা' : 'District', upazila: language === 'bn' ? 'উপজেলা' : 'Upazila', union: language === 'bn' ? 'ইউনিয়ন' : 'Union', post_office: language === 'bn' ? 'পোস্ট অফিস' : 'Post office', postal_code: language === 'bn' ? 'পোস্টাল কোড' : 'Postal code', contact_phone: language === 'bn' ? 'যোগাযোগের ফোন' : 'Phone', contact_whatsapp: 'WhatsApp', contact_email: language === 'bn' ? 'যোগাযোগের ইমেইল' : 'Email', footer_copyright: language === 'bn' ? 'কপিরাইট' : 'Copyright' }
  const public_keys = new Set(['website_name','village_name','village_slogan','village_description','district','upazila','union','post_office','postal_code','contact_phone','contact_whatsapp','contact_email','footer_copyright'])
  for (const item of (information ?? []).filter((item) => item?.is_active !== false)) {
    if (!public_keys.has(item.information_key)) continue
    const title = labels[item.information_key] || (language === 'bn' ? 'ওয়েবসাইটের তথ্য' : 'Website information')
    const value = text_value(item.information_value, language)
    const searchable_values = localized_values(item.information_value)
    if (!searchable_values.length) continue
    const searchable_text = searchable_values.join(' ')
    const targets = {
      website_name: '/#public-home', village_name: '/#public-home', village_slogan: '/#public-home', village_description: '/#public-village_description',
      district: '/#public-contact', upazila: '/#public-contact', union: '/#public-contact', post_office: '/#public-contact', postal_code: '/#public-contact',
      contact_phone: '/#public-contact', contact_whatsapp: '/#public-contact', contact_email: '/#public-contact', footer_copyright: '/#public-footer'
    }
    add('information', title, snippet(searchable_text, q) || value, targets[item.information_key] || '/#public-home', 'information-' + item.information_key, searchable_text)
  }
  for (const page of pages ?? []) {
    if (!page.is_visible || page.status !== 'published' || !page.page_slug) continue
    const title = text_value(page.page_title, language)
    const content = plain_text(page.html_content)
    const title_values = localized_values(page.page_title)
    const searchable_text = title_values.concat(content).filter(Boolean).join(' ')
    add('page', title || (language === 'bn' ? 'তথ্য পেজ' : 'Information page'), snippet(searchable_text, q), '/' + String(page.page_slug).replace(/^\/+|\/+$/g, ''), 'page-' + (page.page_id ?? page.page_slug), searchable_text)
  }
  for (const post of posts ?? []) {
    if (!post.is_visible || post.status !== 'published') continue
    const title = text_value(post.caption, language)
    const searchable_text = localized_values(post.caption).join(' ')
    add('post', title || (language === 'bn' ? 'পোস্ট' : 'Post'), snippet(searchable_text, q), '/#post-' + post.post_id, 'post-' + post.post_id, searchable_text)
  }
  return results.sort((a,b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 30)
}
export function public_search({ information = [], pages = [], posts = [], language = 'bn' }) {
  const [open, set_open] = useState(false)
  const [query, set_query] = useState('')
  const dom_entries = typeof document === 'undefined' ? [] : get_visible_public_dom_entries()

  const results = useMemo(
    () => make_results({ information, pages, posts, dom_entries }, language, query),
    [information, pages, posts, language, query, dom_entries.length]
  )

  useEffect(() => {
    if (!open) return
    const on_key = (event) => {
      if (event.key === 'Escape') set_open(false)
    }
    window.addEventListener('keydown', on_key)
    return () => window.removeEventListener('keydown', on_key)
  }, [open])

  function close() {
    set_open(false)
    set_query('')
  }

  return createElement('div', { className: 'public-search' },
    createElement('button', {
      type: 'button',
      className: 'website-header-control public-search-trigger',
      onClick: () => set_open(true),
      'aria-label': language === 'bn' ? 'ওয়েবসাইটে খুঁজুন' : 'Search website',
      title: language === 'bn' ? 'ওয়েবসাইটে খুঁজুন' : 'Search website'
    }, '⌕'),
    open && createElement('div', { className: 'public-search-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': language === 'bn' ? 'ওয়েবসাইট সার্চ' : 'Website search' },
      createElement('button', { type: 'button', className: 'public-search-backdrop', onClick: close, 'aria-label': language === 'bn' ? 'সার্চ বন্ধ করুন' : 'Close search' }),
      createElement('section', { className: 'public-search-panel' },
        createElement('div', { className: 'public-search-header' },
          createElement('strong', null, language === 'bn' ? 'ওয়েবসাইটে খুঁজুন' : 'Search the website'),
          createElement('button', { type: 'button', onClick: close, 'aria-label': language === 'bn' ? 'বন্ধ করুন' : 'Close' }, '×')
        ),
        createElement('div', { className: 'public-search-input-wrap' },
          createElement('span', { 'aria-hidden': 'true' }, '⌕'),
          createElement('input', {
            autoFocus: true,
            value: query,
            onChange: (event) => set_query(event.target.value),
            placeholder: language === 'bn' ? 'যে তথ্য খুঁজছেন লিখুন…' : 'Type what you are looking for…',
            'aria-label': language === 'bn' ? 'সার্চ' : 'Search'
          })
        ),
        query.trim()
          ? results.length
            ? createElement('div', { className: 'public-search-results' },
                createElement('div', { className: 'public-search-count' }, language === 'bn' ? `${results.length}টি ফলাফল` : `${results.length} results`),
                results.map((result) => {
                  const external = /^https?:\/\//i.test(result.to)
                  const props = external
                    ? { href: result.to, target: '_blank', rel: 'noreferrer' }
                    : { to: result.to, onClick: close }
                  return createElement(external ? 'a' : Link, { key: result.key, className: 'public-search-result', ...props },
                    createElement('span', { className: 'public-search-result-type' }, result.type === 'page' ? (language === 'bn' ? 'পেজ' : 'Page') : result.type === 'post' ? (language === 'bn' ? 'পোস্ট' : 'Post') : result.type === 'link' ? (language === 'bn' ? 'লিংক' : 'Link') : (language === 'bn' ? 'তথ্য' : 'Info')),
                    createElement('strong', null, result.title),
                    result.description && createElement('span', null, result.description)
                  )
                })
              )
            : createElement('div', { className: 'public-search-empty' }, language === 'bn' ? 'কোনো মিল পাওয়া যায়নি।' : 'No matching public information found.')
          : createElement('div', { className: 'public-search-hint' }, language === 'bn' ? 'পাবলিক ওয়েবসাইটে বর্তমানে দেখা যাচ্ছে এমন লেখা, শিরোনাম, বাটন, লিংক, কনটেন্ট ও তথ্যের মধ্যে খোঁজা হবে।' : 'Searches visible public website text, headings, buttons, links, content and information.')
      )
    )
  )
}
