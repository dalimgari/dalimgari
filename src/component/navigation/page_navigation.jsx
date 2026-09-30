import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { get_localized_value } from '../../function/translation/language'

export function page_navigation({ pages = [], language = 'bn' }) {
  return createElement(
    'nav',
    { className: 'page-navigation' },
    pages
      .filter((page) => page.is_visible)
      .sort((a, b) => a.display_order - b.display_order)
      .map((page) => createElement(
        Link,
        { key: page.page_id, to: `/${page.page_slug}` },
        get_localized_value(page.page_title, language)
      ))
  )
}
