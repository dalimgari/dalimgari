import { createElement, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { get_user_session } from '../../controller/user/user_auth_controller.js'
import { get_current_user_role } from '../../controller/user/user_permission_controller.js'

export function auth_guard({ children, area }) {
  const [state, set_state] = useState({ loading: true, role: null })

  useEffect(() => {
    let active = true
    Promise.all([get_user_session(), get_current_user_role()])
      .then(([session_result, role]) => {
        if (!active) return
        set_state({ loading: false, role: session_result.data.session?.user ? role : null })
      })
      .catch(() => {
        if (active) set_state({ loading: false, role: null })
      })
    return () => { active = false }
  }, [])

  if (state.loading) return createElement('main', null, 'Loading...')
  if (!state.role) return createElement(Navigate, { to: '/login', replace: true })

  const is_user = state.role.role_key === 'user'
  if (area === 'user' && !is_user) return createElement(Navigate, { to: '/admin', replace: true })
  if (area === 'admin' && is_user) return createElement(Navigate, { to: '/user', replace: true })

  return children
}
