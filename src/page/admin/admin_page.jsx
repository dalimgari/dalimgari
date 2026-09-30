import { createElement } from 'react'
import { admin_dashboard_layout } from '../../layout/admindashboard/admin_dashboard_layout'
import { dashboard_modules } from '../../module/admindashboard/dashboard_modules'
import { module_navigation } from '../../component/admindashboard/module_navigation'
import { get_current_admin } from '../../controller/admin/admin_dashboard_controller'
import { get_admin_permissions } from '../../controller/admin/module_access_controller'
import { useEffect, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'

export function admin_page() {
  const [admin, set_admin] = useState(null)
  const [permissions, set_permissions] = useState(new Set())
  const [admin_information, set_admin_information] = useState(null)
  const [selected_module, set_selected_module] = useState(null)

  useEffect(() => {
    Promise.all([get_current_admin(), get_admin_permissions()]).then(([current_admin, access]) => {
      set_admin(current_admin)
      if (current_admin?.profile_id) {
        const { data: info } = await supabase
          .from('admin_information')
          .select('information_value,other_links')
          .eq('profile_id', current_admin.profile_id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        set_admin_information(info ?? null)
      }
      set_permissions(new Set(access.flatMap((item) => (item.roles?.role_permissions ?? []).map((role_permission) => role_permission.permissions?.permission_key).filter(Boolean))))
    }).catch(() => {
      set_admin(null)
    })
  }, [])

  if (!admin) return createElement('main', { className: 'admin-access-denied' }, 'Admin access required')

  return createElement(admin_dashboard_layout, {
    navigation: createElement(module_navigation, { modules: dashboard_modules, permissions, on_select: set_selected_module, selected_module, admin_information }),
    content: createElement('section', { className: 'admin-module-content' },
      createElement('h1', null, 'Admin Dashboard'),
      createElement('p', null, admin.display_name ?? admin.email ?? ''),
      selected_module ? createElement('div', { 'data-module-key': selected_module }, selected_module) : createElement('p', null, 'Select a module')
    )
  })
}
