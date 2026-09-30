import { createElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import { public_page } from '../../page/public/public_page'
import { admin_dashboard_page } from '../../page/admin/admin_dashboard_page'
import { user_dashboard_page } from '../../page/user/user_dashboard_page'

export function app_router() {
  return createElement(
    Routes,
    null,
    createElement(Route, { path: '/admin/*', element: createElement(admin_dashboard_page) }),
    createElement(Route, { path: '/user/*', element: createElement(user_dashboard_page) }),
    createElement(Route, { path: '*', element: createElement(public_page) })
  )
}
