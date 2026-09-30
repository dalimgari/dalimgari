import { createElement, useEffect, useState } from 'react'
import { admin_dashboard_layout } from '../../layout/admindashboard/admin_dashboard_layout'
import { module_navigation } from '../../component/admindashboard/module_navigation'
import { admin_module_workspace } from '../../component/admindashboard/admin_module_workspace'
import { dashboard_modules } from '../../module/admindashboard/dashboard_modules'
import { get_current_admin, sign_out_admin } from '../../controller/admin/admin_dashboard_controller'
import { get_admin_permissions } from '../../controller/admin/module_access_controller'

export function admin_dashboard_page() {
  const [admin, set_admin] = useState(null)
  const [permissions, set_permissions] = useState(new Set())
  const [selected_module, set_selected_module] = useState('websiteinformation')
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    Promise.all([get_current_admin(), get_admin_permissions()]).then(([profile, rows]) => {
      const keys = new Set(rows.flatMap((row) => (row.roles?.role_permissions ?? []).map((item) => item.permissions?.permission_key).filter(Boolean)))
      set_admin(profile)
      set_permissions(keys)
    }).finally(() => set_loading(false))
  }, [])

  if (loading) return createElement('main', null, 'Loading...')
  if (!admin) return createElement('main', null, 'Admin access required')

  return createElement(admin_dashboard_layout, {
    navigation: createElement(module_navigation, { modules: dashboard_modules, permissions, on_select: set_selected_module }),
    content: createElement('section', null,
      createElement('header', null, createElement('h1', null, 'Admin Dashboard'), createElement('span', null, admin.display_name ?? admin.email), createElement('button', { type: 'button', onClick: sign_out_admin }, 'Sign out')),
      createElement(admin_module_workspace, { module_key: selected_module })
    )
  })
}
