import { createElement } from 'react'

export function footer({ content = '' }) {
  return createElement('footer', { className: 'website-footer' }, content)
}
