import { createElement } from 'react'

export function footer({ content = '' }) {
  return createElement(
    'footer',
    { className: 'website-footer', role: 'contentinfo' },
    createElement('div', { className: 'website-footer-content' }, content)
  )
}
