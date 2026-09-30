import { createElement, useEffect, useState } from 'react'
import { user_dashboard_layout } from '../../layout/userdashboard/user_dashboard_layout'
import { user_dashboard_navigation } from '../../component/userdashboard/user_dashboard_navigation'
import { user_dashboard_modules } from '../../module/userdashboard/user_dashboard_modules'
import { load_user_dashboard } from '../../controller/user/user_dashboard_controller'
import { sign_out_user } from '../../controller/user/user_auth_controller'
import { user_profile_form } from '../../component/userdashboard/user_profile_form'
import { user_account_settings } from '../../component/userdashboard/user_account_settings'

export function user_dashboard_page() {
  const [dashboard, set_dashboard] = useState(null)
  const [selected_module, set_selected_module] = useState('profile')

  useEffect(() => { load_user_dashboard().then(set_dashboard) }, [])

  if (!dashboard) return createElement('main', null, 'Loading...')
  if (!dashboard.profile) return createElement('main', null, 'User access required')

  const content = selected_module === 'settings'
    ? createElement(user_account_settings)
    : createElement(user_profile_form, { profile: dashboard.profile })

  return createElement(user_dashboard_layout, {
    profile: dashboard.profile,
    content: createElement('section', null,
      createElement(user_dashboard_navigation, { modules: user_dashboard_modules, permissions: dashboard.permissions, on_select: set_selected_module }),
      createElement('button', { type: 'button', onClick: sign_out_user }, 'Sign out'),
      content
    )
  })
}
