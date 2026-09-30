import { createElement } from 'react'

export function admin_dashboard_layout({ navigation = null, content = null }) {
  return createElement('section', { className: 'admin-dashboard-layout' }, navigation, createElement('main', { className: 'admin-dashboard-content' }, content))
}
