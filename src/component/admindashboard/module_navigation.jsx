import { createElement } from 'react'

function normalize_admin_url(value) {
  const input = String(value ?? '').trim()
  if (!input) return ''
  if (!/^https?:\/\//i.test(input)) return 'https://' + input
  try { return new URL(input).toString() } catch { return '' }
}

function admin_link_icon(url) {
  try {
    const domain = new URL(normalize_admin_url(url)).hostname.replace(/^www\./i, '')
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=128'
  } catch { return '' }
}

export function module_navigation({ modules = [], permissions = new Set(), on_select = () => {}, selected_module = '', admin_information = null }) {
  const visible_modules = modules.filter((module) => permissions.has(module.permission))

  return createElement(
    'nav',
    { className: 'admin-module-navigation', 'aria-label': 'Admin dashboard navigation' },
    visible_modules.map((module) => createElement(
      'button',
      {
        key: module.key,
        type: 'button',
        className: selected_module === module.key ? 'is-active' : '',
        onClick: () => on_select(module.key),
        'aria-current': selected_module === module.key ? 'page' : undefined,
        title: module.label
      },
      createElement('span', { className: 'admin-module-navigation-label' }, module.label)
    )),
    createElement('div', { className: 'admin-sidebar-profile' },
      createElement('div', { className: 'admin-sidebar-profile-image-wrap' },
        createElement('img', {
          className: 'admin-sidebar-profile-image',
          src: admin_information?.information_value?.admin_profile_image || '',
          alt: admin_information?.information_value?.admin_name || 'Admin',
          loading: 'lazy'
        })
      ),
      createElement('strong', { className: 'admin-sidebar-profile-name' }, admin_information?.information_value?.admin_name || 'Admin'),
      createElement('div', { className: 'admin-sidebar-links', 'aria-label': 'Admin links' },
        (Array.isArray(admin_information?.other_links?.admin_sidebar_links) ? admin_information.other_links.admin_sidebar_links : [])
          .map((link, index) => {
            const url = normalize_admin_url(link.url)
            if (!url) return null
            return createElement('a', {
              key: (link.title || 'link') + '-' + index,
              href: url,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'admin-sidebar-link',
              title: link.title || url,
              'aria-label': link.title || url
            }, createElement('img', { src: admin_link_icon(url), alt: '', width: 28, height: 28, loading: 'lazy' }))
          })
      )
    )
  )
}
