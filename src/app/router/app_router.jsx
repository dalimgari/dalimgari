import { createElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import { public_page } from '../../page/public/public_page'
import { login_page } from '../../page/auth/login_page'
import { admin_dashboard_page } from '../../page/admin/admin_dashboard_page'
import { user_dashboard_page } from '../../page/user/user_dashboard_page'
import { auth_guard } from '../../component/auth/auth_guard'

export function app_router() {
  return createElement(
    Routes,
    null,
    createElement(Route, { path: '/login', element: createElement(login_page) }),
    createElement(Route, { path: '/admin/*', element: createElement(auth_guard, { area: 'admin' }, createElement(admin_dashboard_page)) }),
    createElement(Route, { path: '/user/*', element: createElement(auth_guard, { area: 'user' }, createElement(user_dashboard_page)) }),
    createElement(Route, { path: '*', element: createElement(public_page) })
  )
}
