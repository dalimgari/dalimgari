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

function snippet(value, query) {
  const text = plain_text(value)
  if (!text) return ''
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase())
  if (index < 0) return text.slice(0, 150)
  const start = Math.max(0, index - 55)
  const end = Math.min(text.length, index + query.length + 95)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

function make_results({ information, pages, posts, links }, language, query) {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return []

  const results = []
  const add = (type, title, description, to, key) => results.push({ type, title, description, to, key })

  const public_information = (information ?? []).filter((item) => item?.is_active !== false)
  for (const item of public_information) {
    const title = {
      website_name: language === 'bn' ? 'ওয়েবসাইট' : 'Website',
      village_name: language === 'bn' ? 'গ্রামের নাম' : 'Village',
      village_slogan: language === 'bn' ? 'স্লোগান' : 'Slogan',
      village_description: language === 'bn' ? 'গ্রামের বর্ণনা' : 'Village description',
      district: language === 'bn' ? 'জেলা' : 'District',
      upazila: language === 'bn' ? 'উপজেলা' : 'Upazila',
      union: language === 'bn' ? 'ইউনিয়ন' : 'Union',
      post_office: language === 'bn' ? 'পোস্ট অফিস' : 'Post office',
      postal_code: language === 'bn' ? 'পোস্টাল কোড' : 'Postal code',
      contact_phone: language === 'bn' ? 'যোগাযোগের ফোন' : 'Phone',
      contact_whatsapp: 'WhatsApp',
      contact_email: language === 'bn' ? 'যোগাযোগের ইমেইল' : 'Email',
      website_address: language === 'bn' ? 'ওয়েবসাইটের ঠিকানা' : 'Website address',
      footer_copyright: language === 'bn' ? 'কপিরাইট' : 'Copyright'
    }[item.information_key] || (language === 'bn' ? 'ওয়েবসাইটের তথ্য' : 'Website information')
    const value = text_value(item.information_value, language)
    if (value.toLocaleLowerCase().includes(q) || title.toLocaleLowerCase().includes(q)) {
      add('information', title, snippet(value || title, query), '/#public-search-home', `information-${item.information_key}`)
    }
  }

  for (const page of pages ?? []) {
    if (!page.is_visible || page.status !== 'published' || !page.page_slug) continue
    const title = text_value(page.page_title, language)
    const content = plain_text(page.html_content)
    if (`${title} ${content}`.toLocaleLowerCase().includes(q)) {
      const slug = String(page.page_slug).replace(/^\/+|\/+$/g, '')
      add('page', title || (language === 'bn' ? 'তথ্য পেজ' : 'Information page'), snippet(content || title, query), `/${slug}`, `page-${page.page_id ?? slug}`)
    }
  }

  for (const post of posts ?? []) {
    if (!post.is_visible || post.status !== 'published') continue
    const title = text_value(post.caption, language)
    if (title.toLocaleLowerCase().includes(q)) {
      add('post', title || (language === 'bn' ? 'পোস্ট' : 'Post'), snippet(title, query), `/#post-${post.post_id}`, `post-${post.post_id}`)
    }
  }

  for (const link of links ?? []) {
    if (link.is_active === false) continue
    const title = text_value(link.title, language)
    const domain = String(link.domain ?? '')
    if (`${title} ${domain}`.toLocaleLowerCase().includes(q)) {
      add('link', title || domain, snippet(domain || title, query), String(link.url ?? '#'), `link-${link.link_key ?? link.managed_link_id}`)
    }
  }

  return results.slice(0, 30)
}

export function public_search({ information = [], pages = [], posts = [], links = [], language = 'bn' }) {
  const [open, set_open] = useState(false)
  const [query, set_query] = useState('')

  const results = useMemo(
    () => make_results({ information, pages, posts, links }, language, query),
    [information, pages, posts, links, language, query]
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
          : createElement('div', { className: 'public-search-hint' }, language === 'bn' ? 'পেজ, পোস্ট, ওয়েবসাইটের তথ্য ও পাবলিক লিংকের মধ্যে খুঁজে পাওয়া যাবে।' : 'Searches public pages, posts, website information and public links.')
      )
    )
  )
}
