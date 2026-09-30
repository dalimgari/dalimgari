import { createElement } from 'react'
import { get_localized_value } from '../../function/translation/language'

export function page_navigation({ pages = [], language = 'bn' }) {
  return createElement('nav', { className: 'page-navigation' }, pages.map((page) => createElement(
    'a',
    { key: page.page_id, href: `/${page.page_slug}` },
    get_localized_value(page.page_title, language)
  )))
}
