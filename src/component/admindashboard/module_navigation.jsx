import { createElement } from 'react'

export function module_navigation({ modules = [], permissions = new Set(), on_select = () => {}, selected_module = '' }) {
  return createElement(
    'nav',
    { className: 'admin-module-navigation', 'aria-label': 'Admin dashboard navigation' },
    modules.filter((module) => permissions.has(module.permission)).map((module) => createElement(
      'button',
      {
        key: module.key,
        type: 'button',
        onClick: () => on_select(module.key),
        'aria-current': selected_module === module.key ? 'true' : undefined
      },
      module.label
    ))
  )
}
