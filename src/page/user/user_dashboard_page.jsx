import { createElement, useEffect, useState } from 'react'
import { user_dashboard_layout } from '../../layout/userdashboard/user_dashboard_layout'
import { user_dashboard_navigation } from '../../component/userdashboard/user_dashboard_navigation'
import { user_dashboard_modules } from '../../module/userdashboard/user_dashboard_modules'
import { load_user_dashboard } from '../../controller/user/user_dashboard_controller.js'
import { sign_out_user } from '../../controller/user/user_auth_controller.js'
import { user_profile_form } from '../../component/userdashboard/user_profile_form'
import { user_account_settings } from '../../component/userdashboard/user_account_settings'

export function user_dashboard_page() {
  const [dashboard, set_dashboard] = useState(null)
  const [error, set_error] = useState(null)
  const [selected_module, set_selected_module] = useState('profile')

  useEffect(() => {
    load_user_dashboard().then(set_dashboard).catch(set_error)
  }, [])

  if (error) return createElement('main', { className: 'dashboard-state' }, createElement('section', { className: 'dashboard-state-card' }, createElement('h1', null, 'ড্যাশবোর্ড লোড করা যায়নি'), createElement('p', null, 'কিছুক্ষণ পর আবার চেষ্টা করুন।')))
  if (!dashboard) return createElement('main', { className: 'dashboard-state' }, createElement('section', { className: 'dashboard-state-card' }, createElement('p', null, 'ড্যাশবোর্ড লোড হচ্ছে...')))
  if (!dashboard.profile) return createElement('main', { className: 'dashboard-state' }, createElement('section', { className: 'dashboard-state-card' }, createElement('h1', null, 'অ্যাক্সেস পাওয়া যায়নি'), createElement('p', null, 'এই অংশ ব্যবহারের জন্য লগইন করুন।')))

  const content = selected_module === 'settings'
    ? createElement(user_account_settings)
    : createElement(user_profile_form, { profile: dashboard.profile })

  return createElement(user_dashboard_layout, {
    profile: dashboard.profile,
    content: createElement('section', { className: 'user-dashboard-workspace' },
      createElement('div', { className: 'user-dashboard-toolbar' },
        createElement('div', null,
          createElement('span', { className: 'dashboard-kicker' }, 'ব্যক্তিগত এলাকা'),
          createElement('h1', null, selected_module === 'settings' ? 'অ্যাকাউন্ট সেটিংস' : 'আমার প্রোফাইল')
        ),
        createElement('button', { type: 'button', className: 'dashboard-signout', onClick: sign_out_user }, 'লগআউট')
      ),
      createElement(user_dashboard_navigation, { modules: user_dashboard_modules, permissions: dashboard.permissions, on_select: set_selected_module }),
      content
    )
  })
}