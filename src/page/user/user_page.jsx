import { createElement, useEffect, useState } from 'react'
import { user_dashboard_layout } from '../../layout/userdashboard/user_dashboard_layout'
import { user_dashboard_modules } from '../../module/userdashboard/user_dashboard_modules'
import { user_dashboard_navigation } from '../../component/userdashboard/user_dashboard_navigation'
import { load_user_dashboard } from '../../controller/user/user_dashboard_controller'

export function user_page() {
  const [dashboard, set_dashboard] = useState(null)
  const [selected_module, set_selected_module] = useState(null)

  useEffect(() => {
    load_user_dashboard().then(set_dashboard).catch(() => set_dashboard(null))
  }, [])

  if (!dashboard?.profile) return createElement('main', { className: 'user-access-required' }, 'User access required')

  return createElement(user_dashboard_layout, {
    profile: dashboard.profile,
    content: createElement('div', null,
      createElement(user_dashboard_navigation, { modules: user_dashboard_modules, permissions: dashboard.permissions, on_select: set_selected_module }),
      createElement('section', { 'data-module-key': selected_module ?? '' }, selected_module ?? 'Select a module')
    )
  })
}
