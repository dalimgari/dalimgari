import { createElement } from 'react'

export function banner({ title = '', description = '', media_url = '' }) {
  return createElement('section', { className: 'website-banner' },
    media_url && createElement('img', { src: media_url, alt: title }),
    createElement('div', { className: 'website-banner-content' },
      createElement('h1', null, title),
      createElement('p', null, description)
    )
  )
}
