import { createElement } from 'react'
import './footer.css'

export function footer({ content = '', copyright = '' }) {
  const text = String(copyright || '').trim()
  return createElement(
    'footer',
    { id: 'public-footer', className: 'website-footer', role: 'contentinfo' },
    createElement('div', { className: 'website-footer-content' }, text || '© 2026. All rights reserved.')
  )
}
