import { createElement } from 'react'

export function module_navigation({ modules = [], permissions = new Set(), on_select = () => {} }) {
  return createElement('nav', { className: 'admin-module-navigation' }, modules.filter((module) => permissions.has(module.permission)).map((module) => createElement(
    'button',
    { key: module.key, type: 'button', onClick: () => on_select(module.key) },
    module.label
  )))
}
