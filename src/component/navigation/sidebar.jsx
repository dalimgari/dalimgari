import { createElement, useState } from 'react'

export function sidebar({ profile = null, navigation_items = [] }) {
  const [is_open, set_is_open] = useState(false)

  return createElement(
    'aside',
    { className: `website-sidebar${is_open ? ' is-open' : ''}` },
    createElement(
      'button',
      { type: 'button', onClick: () => set_is_open((value) => !value), 'aria-expanded': is_open },
      is_open ? '×' : '☰'
    ),
    is_open && createElement(
      'div',
      { className: 'website-sidebar-content' },
      profile && createElement(
        'div',
        { className: 'sidebar-profile' },
        profile.profile_image_url && createElement('img', { src: profile.profile_image_url, alt: profile.display_name ?? '' }),
        createElement('strong', null, profile.display_name ?? ''),
        createElement('span', null, profile.email ?? ''),
        createElement('div', { className: 'sidebar-links' }, (profile.social_links?.links ?? []).map((link) => createElement('a', { key: link.url, href: link.url, target: '_blank', rel: 'noreferrer' }, link.label ?? link.url)))
      ),
      createElement(
        'nav',
        null,
        navigation_items.map((item) => createElement('a', { key: item.page_key, href: item.href ?? `/${item.page_slug}` }, item.page_title?.bn ?? item.page_title?.en ?? item.page_key))
      )
    )
  )
}
