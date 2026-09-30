import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { get_localized_value } from '../../function/translation/language'

export function sidebar({ id = 'website-sidebar', is_open = false, profile = null, navigation_items = [], language = 'bn' }) {
  return createElement(
    'aside',
    { id, className: `website-sidebar${is_open ? ' is-open' : ''}`, 'aria-hidden': !is_open },
    is_open && createElement(
      'div',
      { className: 'website-sidebar-content' },
      profile && createElement(
        'div',
        { className: 'sidebar-profile' },
        profile.profile_image_url && createElement('img', { src: profile.profile_image_url, alt: profile.display_name ?? '' }),
        createElement('strong', null, profile.display_name ?? ''),
        profile.email && createElement('span', null, profile.email),
        profile.phone && createElement('span', null, profile.phone),
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
        navigation_items
          .filter((item) => item.page_slug && item.is_visible)
          .map((item) =>
            createElement(
              Link,
              { key: item.page_key, to: `/${item.page_slug}`, onClick: undefined },
              get_localized_value(item.page_title, language)
            )
          )
      )
    )
  )
}
