import { createElement } from 'react'

export function header({ site_title = '', language_control = null, theme_control = null, sidebar_toggle = null }) {
  return createElement(
    'header',
    { className: 'website-header' },
    createElement('div', { className: 'website-header-leading' }, sidebar_toggle),
    createElement('div', { className: 'website-header-title' }, site_title),
    createElement('div', { className: 'website-header-controls' }, language_control, theme_control)
  )
}
