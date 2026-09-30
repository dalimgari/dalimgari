import { createElement, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { get_localized_value } from '../../function/translation/language'

function text_value(value, language = 'bn') {
  if (!value) return ''
  if (typeof value === 'object') return get_localized_value(value, language) || ''
  return String(value)
}

function plain_text(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim()
}


function normalize_text(value) {
  return plain_text(value).toLocaleLowerCase().normalize('NFC')
}

function words(value) {
  return normalize_text(value).split(/[^\\p{L}\\p{N}]+/u).filter(Boolean)
}

function match_score(value, query) {
  const text = normalize_text(value)
  const q = normalize_text(query)
  const q_words = words(q)
  const t_words = words(text)
  if (!text || !q || !q_words.length) return 0
  const exact_phrase = text.includes(q)
  const exact_words = q_words.filter((word) => t_words.includes(word)).length
  const prefix_words = q_words.filter((word) => t_words.some((item) => item.startsWith(word))).length
  const partial_words = q_words.filter((word) => text.includes(word)).length
  let score = 0
  if (exact_phrase) score += 100000
  score += exact_words * 10000
  if (exact_words === q_words.length) score += 5000
  score += prefix_words * 1000
  score += partial_words * 100
  return score
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

function make_results({ information, pages, posts }, language, query) {
  const q = query.trim()
  if (!q) return []
  const results = []
  const add = (type, title, description, to, key, searchable_text) => {
    const score = match_score(searchable_text, q)
    if (score > 0) results.push({ type, title, description, to, key, score })
  }
  const labels = { website_name: language === 'bn' ? 'ওয়েবসাইট' : 'Website', village_name: language === 'bn' ? 'গ্রামের নাম' : 'Village', village_slogan: language === 'bn' ? 'স্লোগান' : 'Slogan', village_description: language === 'bn' ? 'গ্রামের বর্ণনা' : 'Village description', district: language === 'bn' ? 'জেলা' : 'District', upazila: language === 'bn' ? 'উপজেলা' : 'Upazila', union: language === 'bn' ? 'ইউনিয়ন' : 'Union', post_office: language === 'bn' ? 'পোস্ট অফিস' : 'Post office', postal_code: language === 'bn' ? 'পোস্টাল কোড' : 'Postal code', contact_phone: language === 'bn' ? 'যোগাযোগের ফোন' : 'Phone', contact_whatsapp: 'WhatsApp', contact_email: language === 'bn' ? 'যোগাযোগের ইমেইল' : 'Email', footer_copyright: language === 'bn' ? 'কপিরাইট' : 'Copyright' }
  const public_keys = new Set(['website_name','village_name','village_slogan','village_description','district','upazila','union','post_office','postal_code','contact_phone','contact_whatsapp','contact_email','footer_copyright'])
  for (const item of (information ?? []).filter((item) => item?.is_active !== false)) {
    if (!public_keys.has(item.information_key)) continue
    const title = labels[item.information_key] || (language === 'bn' ? 'ওয়েবসাইটের তথ্য' : 'Website information')
    const value = text_value(item.information_value, language)
    if (!value.trim()) continue
    add('information', title, snippet(value || title, q), '/#public-' + item.information_key, 'information-' + item.information_key, title + ' ' + value)
  }
  for (const page of pages ?? []) {
    if (!page.is_visible || page.status !== 'published' || !page.page_slug) continue
    const title = text_value(page.page_title, language)
    const content = plain_text(page.html_content)
    add('page', title || (language === 'bn' ? 'তথ্য পেজ' : 'Information page'), snippet(content || title, q), '/' + String(page.page_slug).replace(/^\\/+|\\/+$/g, ''), 'page-' + (page.page_id ?? page.page_slug), title + ' ' + content)
  }
  for (const post of posts ?? []) {
    if (!post.is_visible || post.status !== 'published') continue
    const title = text_value(post.caption, language)
    add('post', title || (language === 'bn' ? 'পোস্ট' : 'Post'), snippet(title, q), '/#post-' + post.post_id, 'post-' + post.post_id, title)
  }
  return results.sort((a,b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 30)
}
export function public_search({ information = [], pages = [], posts = [], language = 'bn' }) {
  const [open, set_open] = useState(false)
  const [query, set_query] = useState('')

  const results = useMemo(
    () => make_results({ information, pages, posts }, language, query),
    [information, pages, posts, language, query]
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
          : createElement('div', { className: 'public-search-hint' }, language === 'bn' ? 'পেজ, পোস্ট, ওয়েবসাইটের তথ্য ও পাবলিক লিংকের মধ্যে খুঁজে পাওয়া যাবে।' : 'Searches only information, pages and posts visible on the public website.')
      )
    )
  )
}
