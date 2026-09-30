import { createElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import { public_page } from '../../page/public/public_page'
import { admin_page } from '../../page/admin/admin_page'
import { user_page } from '../../page/user/user_page'

export function app_router() {
  return createElement(
    Routes,
    null,
    createElement(Route, { path: '/admin/*', element: createElement(admin_page) }),
    createElement(Route, { path: '/user/*', element: createElement(user_page) }),
    createElement(Route, { path: '*', element: createElement(public_page) })
  )
}
