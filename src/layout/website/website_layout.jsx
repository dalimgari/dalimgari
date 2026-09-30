import { cloneElement, createElement, useState } from 'react'
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
  const [sidebar_open, set_sidebar_open] = useState(false)
  const toggle_sidebar = () => set_sidebar_open((value) => !value)

  const website_header = header
    ? cloneElement(header, {
        sidebar_toggle: createElement(
          'button',
          {
            type: 'button',
            className: 'website-sidebar-toggle',
            onClick: toggle_sidebar,
            'aria-expanded': sidebar_open,
            'aria-controls': 'website-sidebar',
            'aria-label': sidebar_open ? 'Close navigation' : 'Open navigation'
          },
          sidebar_open ? '×' : '☰'
        )
      })
    : null

  return createElement(
    'div',
    { className: 'website-layout' },
    createElement(sidebar, {
      id: 'website-sidebar',
      is_open: sidebar_open,
      on_toggle: toggle_sidebar,
      profile,
      navigation_items,
      language
    }),
    createElement(
      'div',
      { className: 'website-content' },
      website_header,
      banner,
      body,
      footer
    )
  )
}
