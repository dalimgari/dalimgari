import { createElement } from 'react'

export function banner({ title = '', description = '', media_url = '' }) {
  return createElement(
    'section',
    { className: 'website-banner', 'aria-labelledby': 'website-banner-title' },
    media_url && createElement('img', { src: media_url, alt: '', loading: 'eager', decoding: 'async' }),
    createElement('div', { className: 'website-banner-content' },
      createElement('h1', { id: 'website-banner-title' }, title),
      description && createElement('p', null, description)
    )
  )
}
