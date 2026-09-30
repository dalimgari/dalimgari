import { createElement } from 'react'
import { get_localized_value } from '../../function/translation/language'

export function post_list({ posts = [], language = 'bn' }) {
  return createElement('section', { className: 'post-list' }, posts.map((post) => createElement(
    'article',
    { key: post.post_id, className: 'post-card' },
    createElement('div', { className: 'post-caption' }, get_localized_value(post.caption, language)),
    post.post_media?.map((item) => item.media?.media_url ? createElement('img', { key: item.post_media_id, src: item.media.media_url, alt: '' }) : null)
  )))
}
