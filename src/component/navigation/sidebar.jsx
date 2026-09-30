import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { get_localized_value } from '../../function/translation/language'

export function sidebar({ id = 'website-sidebar', is_open = false, on_toggle = () => {}, profile = null, navigation_items = [], language = 'bn' }) {
  const visible_pages = navigation_items.filter((item) => item.page_slug && item.is_visible)

  return createElement(
    'div',
    { className: 'website-sidebar-layer' },
    is_open && createElement(
      'button',
      {
        type: 'button',
        className: 'website-sidebar-overlay',
        onClick: on_toggle,
        'aria-label': language === 'bn' ? 'সাইডবার বন্ধ করুন' : 'Close navigation'
      }
    ),
    createElement(
      'aside',
      { id, className: `website-sidebar${is_open ? ' is-open' : ''}`, 'aria-hidden': !is_open },
      is_open && createElement(
        'div',
        { className: 'website-sidebar-content' },
        createElement(
          'div',
          { className: 'website-sidebar-header' },
          createElement('strong', null, language === 'bn' ? 'মেনু' : 'Menu'),
          createElement(
            'button',
            {
              type: 'button',
              className: 'website-sidebar-close',
              onClick: on_toggle,
              'aria-label': language === 'bn' ? 'সাইডবার বন্ধ করুন' : 'Close navigation'
            },
            '×'
          )
        ),
        profile && createElement(
          'div',
          { className: 'sidebar-profile' },
          profile.profile_image_url && createElement('img', { src: profile.profile_image_url, alt: profile.display_name ?? '' }),
          createElement('strong', null, profile.display_name ?? ''),
          profile.email && createElement('span', null, profile.email),
          profile.phone && createElement('span', null, profile.phone),
          profile.bio && createElement('p', null, profile.bio),
          createElement(
            'div',
            { className: 'sidebar-links' },
            (profile.social_links?.links ?? []).map((link) =>
              createElement('a', { key: link.url, href: link.url, target: '_blank', rel: 'noreferrer' }, link.label ?? link.url)
            )
          )
        ),
        createElement(
          'nav',
          { 'aria-label': language === 'bn' ? 'প্রধান নেভিগেশন' : 'Main navigation' },
          createElement(
            Link,
            { to: '/', onClick: on_toggle },
            language === 'bn' ? 'হোম' : 'Home'
          ),
          visible_pages.map((item) =>
            createElement(
              Link,
              { key: item.page_key, to: `/${String(item.page_slug).replace(/^\/+|\/+$/g, '')}`, onClick: on_toggle },
              get_localized_value(item.page_title, language)
            )
          ),
          createElement(
            Link,
            { to: '/login', onClick: on_toggle },
            language === 'bn' ? 'লগইন' : 'Login'
          )
        )
      )
    )
  )
}