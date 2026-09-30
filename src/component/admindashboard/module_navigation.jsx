import { createElement } from 'react'

export function module_navigation({ modules = [], permissions = new Set(), on_select = () => {}, selected_module = '' }) {
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
    ))
  )
}
