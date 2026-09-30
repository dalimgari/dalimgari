import { createElement } from 'react'

export function page_navigation({ pages = [] }) {
  return createElement('nav', { className: 'page-navigation' }, pages.filter((page) => page.is_visible).sort((a, b) => a.display_order - b.display_order).map((page) => createElement('a', { key: page.page_id, href: `/${page.page_slug}` }, page.page_title?.bn ?? page.page_title?.en ?? page.page_key)))
}
