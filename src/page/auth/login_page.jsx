import { createElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sign_in_user, get_user_session } from '../../controller/user/user_auth_controller'
import { get_user_role } from '../../controller/user/user_permission_controller'

export function login_page() {
  const navigate = useNavigate()
  const [email, set_email] = useState('')
  const [password, set_password] = useState('')
  const [loading, set_loading] = useState(true)
  const [error, set_error] = useState('')

  useEffect(() => {
    get_user_session().then(async ({ data }) => {
      if (!data.session?.user) {
        set_loading(false)
        return
      }
      const role = await get_user_role(data.session.user.id)
      navigate(role?.role_key === 'user' ? '/user' : '/admin', { replace: true })
    }).catch(() => set_loading(false))
  }, [navigate])

  async function submit(event) {
    event.preventDefault()
    set_error('')
    set_loading(true)
    const { error: sign_in_error } = await sign_in_user({ email, password })
    if (sign_in_error) {
      set_error(sign_in_error.message)
      set_loading(false)
      return
    }
    const { data } = await get_user_session()
    const role = data.session?.user ? await get_user_role(data.session.user.id) : null
    navigate(role?.role_key === 'user' ? '/user' : '/admin', { replace: true })
  }

  if (loading) return createElement('main', { className: 'login-page' }, createElement('p', null, 'Loading...'))

  return createElement('main', { className: 'login-page' },
    createElement('form', { className: 'login-card', onSubmit: submit },
      createElement('h1', null, 'Login'),
      createElement('label', null, 'Email', createElement('input', { type: 'email', value: email, onChange: (event) => set_email(event.target.value), required: true, autoComplete: 'email' })),
      createElement('label', null, 'Password', createElement('input', { type: 'password', value: password, onChange: (event) => set_password(event.target.value), required: true, autoComplete: 'current-password' })),
      error ? createElement('p', { className: 'login-error', role: 'alert' }, error) : null,
      createElement('button', { type: 'submit', disabled: loading }, loading ? 'Signing in...' : 'Login')
    )
  )
}
