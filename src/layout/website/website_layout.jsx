import { cloneElement, createElement, useEffect, useRef, useState } from 'react'
import { sidebar } from '../../component/navigation/sidebar'

export function website_layout({
  header = null,
  banner = null,
  body = null,
  footer = null,
  profile = null,
  managed_links = [],
  navigation_items = [],
  language = 'bn'
}) {
  const [sidebar_open, set_sidebar_open] = useState(false)
  const header_ref = useRef(null)
  const toggle_sidebar = () => set_sidebar_open((value) => !value)
  const header_props = header?.props ?? {}

  useEffect(() => {
    const update_header_height = () => {
      const height = header_ref.current?.getBoundingClientRect().height
      if (height) document.documentElement.style.setProperty('--website-header-height', `${height}px`)
    }

    update_header_height()
    const observer = header_ref.current ? new ResizeObserver(update_header_height) : null
    if (observer && header_ref.current) observer.observe(header_ref.current)
    window.addEventListener('resize', update_header_height)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update_header_height)
    }
  }, [])

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
      managed_links,
      navigation_items,
      language,
      site_title: header_props.site_title,
      site_tagline: header_props.site_tagline,
      logo_url: header_props.logo_url
    }),
    createElement(
      'div',
      { className: 'website-content' },
      website_header && createElement('div', { ref: header_ref }, website_header),
      banner,
      body,
      footer
    )
  )
}
