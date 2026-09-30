import { createElement } from 'react'

export function user_dashboard_navigation({ modules = [], permissions = [], on_select = () => {}, selected_key = '' }) {
  const visible_modules = modules.filter((module) => permissions.includes(module.permission))

  return createElement(
    'nav',
    { className: 'user-dashboard-navigation', 'aria-label': 'User dashboard navigation' },
    visible_modules.map((module) => createElement(
      'button',
      {
        key: module.key,
        type: 'button',
        onClick: () => on_select(module.key),
        className: selected_key === module.key ? 'is-active' : '',
        'aria-current': selected_key === module.key ? 'page' : undefined
      },
      module.label
    ))
  )
}
