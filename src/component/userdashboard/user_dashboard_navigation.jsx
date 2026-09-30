import { createElement } from 'react'

export function user_dashboard_navigation({ modules = [], permissions = [], on_select = () => {} }) {
  return createElement('nav', { className: 'user-dashboard-navigation' }, modules.filter((module) => permissions.includes(module.permission)).map((module) => createElement('button', { key: module.key, type: 'button', onClick: () => on_select(module.key) }, module.label)))
}
