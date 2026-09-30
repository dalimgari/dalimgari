import { createElement } from 'react'

export function user_dashboard_layout({ profile = null, content = null }) {
  return createElement('section', { className: 'user-dashboard-layout' },
    createElement('header', { className: 'user-dashboard-header' },
      profile?.profile_image_url ? createElement('img', { src: profile.profile_image_url, alt: profile.display_name ?? '' }) : null,
      createElement('strong', null, profile?.display_name ?? ''),
      createElement('span', null, profile?.email ?? '')
    ),
    createElement('main', { className: 'user-dashboard-content' }, content)
  )
}
