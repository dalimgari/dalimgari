import { createElement } from 'react'

export function user_dashboard_layout({ profile = null, content = null }) {
  return createElement('section', { className: 'user-dashboard-layout' },
    createElement('header', { className: 'user-dashboard-header' },
      createElement('div', { className: 'user-dashboard-identity' },
        profile?.profile_image_url
          ? createElement('img', { src: profile.profile_image_url, alt: profile.display_name ?? '' })
          : createElement('span', { className: 'user-dashboard-avatar', 'aria-hidden': 'true' }, (profile?.display_name ?? 'ব্য').slice(0, 1)),
        createElement('div', null,
          createElement('strong', null, profile?.display_name ?? 'ব্যবহারকারী'),
          createElement('span', null, profile?.email ?? '')
        )
      )
    ),
    createElement('main', { className: 'user-dashboard-content' }, content)
  )
}