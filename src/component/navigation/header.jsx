import { createElement } from 'react'
import { Link } from 'react-router-dom'

export function header({ site_title = '', site_tagline = '', logo_url = '', language_control = null, theme_control = null, sidebar_toggle = null }) {
  return createElement(
    'header',
    { className: 'website-header' },
    createElement('div', { className: 'website-header-leading' }, sidebar_toggle),
    createElement(
      Link,
      { to: '/', className: 'website-brand', 'aria-label': site_title || 'Home' },
      logo_url
        ? createElement('img', { className: 'website-brand-logo', src: logo_url, alt: '' })
        : createElement('span', { className: 'website-brand-mark', 'aria-hidden': 'true' }, 'ড'),
      createElement('span', { className: 'website-brand-copy' },
        createElement('strong', null, site_title),
        site_tagline && createElement('small', null, site_tagline)
      )
    ),
    createElement(
      'div',
      { className: 'website-header-controls' },
      language_control,
      theme_control,
      createElement(Link, { to: '/login', className: 'website-header-control website-login-link', 'aria-label': 'Login' }, 'লগইন')
    )
  )
}
