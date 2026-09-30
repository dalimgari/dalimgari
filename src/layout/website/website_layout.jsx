import { createElement } from 'react'
import { sidebar } from '../../component/navigation/sidebar'

export function website_layout({
  header = null,
  banner = null,
  body = null,
  footer = null,
  profile = null,
  navigation_items = [],
  language = 'bn'
}) {
  return createElement(
    'div',
    { className: 'website-layout' },
    createElement(sidebar, { profile, navigation_items, language }),
    createElement(
      'div',
      { className: 'website-content' },
      header,
      banner,
      body,
      footer
    )
  )
}
