import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { get_localized_value } from '../../function/translation/language'

export function page_navigation({ pages = [], language = 'bn' }) {
  const visible_pages = [...pages]
    .filter((page) => page.is_visible && page.page_slug)
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0))

  return createElement(
    'nav',
    { className: 'page-navigation', 'aria-label': language === 'bn' ? 'পাতা নেভিগেশন' : 'Page navigation' },
    visible_pages.map((page) => {
      const slug = String(page.page_slug).replace(/^\/+|\/+$/g, '')
      return createElement(
        Link,
        { key: page.page_id ?? page.page_key ?? slug, to: slug ? `/${slug}` : '/' },
        get_localized_value(page.page_title, language)
      )
    })
  )
}
