import { createElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { admin_dashboard_layout } from '../../layout/admindashboard/admin_dashboard_layout'
import { module_navigation } from '../../component/admindashboard/module_navigation'
import { admin_module_workspace } from '../../component/admindashboard/admin_module_workspace'
import { backup_recovery_panel } from '../../component/admindashboard/backup_recovery_panel'
import { dashboard_modules } from '../../module/admindashboard/dashboard_modules'
import { get_current_admin, sign_out_admin } from '../../controller/admin/admin_dashboard_controller.js'
import { get_admin_permissions } from '../../controller/admin/module_access_controller.js'

export function admin_dashboard_page() {
  const [admin, set_admin] = useState(null)
  const [permissions, set_permissions] = useState(new Set())
  const [selected_module, set_selected_module] = useState('websiteinformation')
  const [loading, set_loading] = useState(true)
  const [error, set_error] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([get_current_admin(), get_admin_permissions()]).then(([profile, rows]) => {
      const keys = new Set(rows.flatMap((row) => (row.roles?.role_permissions ?? []).map((item) => item.permissions?.permission_key).filter(Boolean)))
      set_admin(profile)
      set_permissions(keys)
    }).catch((load_error) => set_error(load_error)).finally(() => set_loading(false))
  }, [])

  if (loading) return createElement('main', null, 'Loading...')
  if (error) return createElement('main', null, `Admin dashboard error: ${error.message}`)
  if (!admin) return createElement('main', null, 'Admin access required')

  const content = createElement('section', null,
    createElement('header', null, createElement('h1', null, 'Admin Dashboard'), createElement('span', null, admin.display_name ?? admin.email), createElement('button', { type: 'button', onClick: async () => { await sign_out_admin(); navigate('/login', { replace: true }) } }, 'Sign out')),
    createElement(admin_module_workspace, { module_key: selected_module }),
    selected_module === 'system' ? createElement(backup_recovery_panel) : null
  )

  return createElement(admin_dashboard_layout, {
    navigation: createElement(module_navigation, { modules: dashboard_modules, permissions, on_select: set_selected_module }),
    content
  })
}
