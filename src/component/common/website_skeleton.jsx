import { createElement } from 'react'

const block = (class_name) => createElement('div', { className: `website-skeleton-block ${class_name}` })

export function website_skeleton() {
  return createElement(
    'main',
    { className: 'website-skeleton', 'aria-label': 'Loading website' },
    createElement('div', { className: 'website-skeleton-header' },
      block('website-skeleton-logo'),
      createElement('div', { className: 'website-skeleton-nav' },
        block('website-skeleton-nav-item'),
        block('website-skeleton-nav-item'),
        block('website-skeleton-nav-item'),
        block('website-skeleton-nav-item')
      )
    ),
    createElement('section', { className: 'website-skeleton-hero' },
      block('website-skeleton-title'),
      block('website-skeleton-line'),
      block('website-skeleton-line short')
    ),
    createElement('section', { className: 'website-skeleton-section' },
      block('website-skeleton-heading'),
      createElement('div', { className: 'website-skeleton-grid' },
        block('website-skeleton-card'),
        block('website-skeleton-card'),
        block('website-skeleton-card')
      )
    ),
    createElement('section', { className: 'website-skeleton-section' },
      block('website-skeleton-heading'),
      block('website-skeleton-wide'),
      block('website-skeleton-wide'),
      block('website-skeleton-wide')
    ),
    createElement('footer', { className: 'website-skeleton-footer' }, block('website-skeleton-footer-line')),
    createElement('div', { className: 'website-skeleton-status' }, 'Loading website…')
  )
}
