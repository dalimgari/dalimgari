import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { get_localized_value } from '../../function/translation/language'
import './sidebar.css'

function first_value(value, language = 'bn') {
  if (!value) return ''
  if (typeof value === 'object') return value[language] ?? value.bn ?? value.en ?? ''
  return String(value)
}

function normalize_links(managed_links = []) {
  return managed_links
    .filter((item) => item?.is_active !== false && item?.url && /^https?:\/\//i.test(String(item.url)))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((item) => ({ ...item, title: item.title ?? item.name ?? item.url }))
}

function link_icon(link) {
  const icon = link.icon_url || link.icon || link.iconUrl || ''
  if (icon) return createElement('img', { src: icon, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer' })
  const domain = String(link.url).replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '')
  return createElement('img', {
    src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
    alt: '',
    loading: 'lazy',
    referrerPolicy: 'no-referrer'
  })
}

export function sidebar({ id = 'website-sidebar', is_open = false, on_toggle = () => {}, navigation_items = [], language = 'bn', profile = null, managed_links = [], language_control = null, theme_control = null }) {
  const visible_pages = navigation_items.filter((item) => item.page_slug && item.is_visible)
  const admin = profile?.information_value && typeof profile.information_value === 'object' ? profile.information_value : (profile ?? {})
  const admin_name = first_value(admin.admin_name, language)
  const admin_image = first_value(admin.admin_profile_image || admin.profile_image || admin.avatar_url, language)
  const admin_links = normalize_links(managed_links)

  return createElement('div', { className: 'website-sidebar-layer' },
    is_open && createElement('button', { type: 'button', className: 'website-sidebar-overlay', onClick: on_toggle, 'aria-label': language === 'bn' ? 'সাইডবার বন্ধ করুন' : 'Close navigation' }),
    createElement('aside', { id, className: `website-sidebar${is_open ? ' is-open' : ''}`, 'aria-hidden': !is_open },
      is_open && createElement('div', { className: 'website-sidebar-content' },
        createElement('nav', { className: 'sidebar-links', 'aria-label': language === 'bn' ? 'প্রধান নেভিগেশন' : 'Main navigation' },
          createElement(Link, { to: '/', onClick: on_toggle }, language === 'bn' ? 'হোম' : 'Home'),
          visible_pages.map((item) => createElement(Link, { key: item.page_key, to: `/${String(item.page_slug).replace(/^\/+|\/+$/g, '')}`, onClick: on_toggle }, get_localized_value(item.page_title, language)))
        ),
        (language_control || theme_control) && createElement('div', { className: 'sidebar-preference-controls', 'aria-label': language === 'bn' ? 'ভাষা ও থিম' : 'Language and theme' },
          language_control && createElement('div', { className: 'sidebar-preference-control sidebar-language-control' }, language_control),
          theme_control && createElement('div', { className: 'sidebar-preference-control sidebar-theme-control' }, theme_control)
        ),
        (admin_name || admin_image || admin_links.length > 0) && createElement('section', { className: 'sidebar-admin-profile', 'aria-label': language === 'bn' ? 'অ্যাডমিন তথ্য' : 'Admin information' },
          admin_image && createElement('img', { className: 'sidebar-admin-avatar', src: admin_image, alt: admin_name || 'Admin', loading: 'lazy' }),
          admin_name && createElement('strong', { className: 'sidebar-admin-name' }, admin_name),
          admin_links.length > 0 && createElement('div', { className: 'sidebar-admin-links' },
            admin_links.map((link, index) => createElement('a', {
              key: link.link_id || link.key || `${link.url}-${index}`,
              href: link.url,
              target: '_blank',
              rel: 'noreferrer',
              'aria-label': first_value(link.title, language) || link.url,
              title: first_value(link.title, language) || link.url
            }, link_icon(link)))
          )
        )
      )
    )
  )
}
