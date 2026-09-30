import { createElement } from 'react'
import '../../style/components/admin_module_navigation.css'

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
    createElement(
      'div',
      { className: 'admin-module-navigation-tabs', role: 'tablist', 'aria-label': 'Admin modules' },
      visible_modules.map((module) => createElement(
        'button',
        {
          key: module.key,
          type: 'button',
          role: 'tab',
          className: selected_module === module.key ? 'is-active' : '',
          onClick: () => on_select(module.key),
          'aria-selected': selected_module === module.key,
          title: module.label
        },
        createElement('span', { className: 'admin-module-navigation-label' }, module.label)
      ))
    ),

  )
}
