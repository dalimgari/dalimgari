import { createElement } from 'react'

export function media_library({ media = [], view_mode = 'all', on_select = () => {} }) {
  const grouped = media.reduce((groups, item) => {
    const key = item.album_id ?? 'ungrouped'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {})

  const groups = view_mode === 'album' ? Object.values(grouped) : [media]

  return createElement('section', { className: 'media-library' }, groups.map((group, index) => createElement(
    'div', { key: group[0]?.album_id ?? index, className: 'media-group' },
    view_mode === 'album' ? createElement('h3', null, group[0]?.albums?.album_name ?? 'Media') : null,
    group.map((item) => createElement('button', { key: item.media_id, type: 'button', onClick: () => on_select(item) },
      item.media_url ? createElement('img', { src: item.media_url, alt: item.media_name ?? '' }) : null,
      createElement('span', null, item.media_name ?? '')
    ))
  )))
}
