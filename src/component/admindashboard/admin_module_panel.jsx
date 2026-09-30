import { createElement } from 'react'

export function admin_module_panel({ title, description = '', children = null }) {
  return createElement('section', { className: 'admin-module-panel' },
    createElement('header', null, createElement('h2', null, title), createElement('p', null, description)),
    createElement('div', { className: 'admin-module-panel-content' }, children)
  )
}
