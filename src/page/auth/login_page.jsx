import { createElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sign_in_user, get_user_session, reset_user_password } from '../../controller/user/user_auth_controller'
import { get_user_role } from '../../controller/user/user_permission_controller'
import { get_website_information } from '../../service/supabase/website_service.js'

function read_setting(settings, keys, fallback = '') {
  for (const key of keys) {
    const item = settings.find((entry) => entry.setting_key === key)
    if (item?.setting_value !== undefined && item?.setting_value !== null) {
      const value = typeof item.setting_value === 'object' ? item.setting_value.value : item.setting_value
      if (value) return String(value)
    }
  }
  return fallback
}

export function login_page() {
  const navigate = useNavigate()
  const [email, set_email] = useState('')
  const [password, set_password] = useState('')
  const [site_name, set_site_name] = useState('')
  const [logo_url, set_logo_url] = useState('')
  const [loading, set_loading] = useState(true)
  const [submitting, set_submitting] = useState(false)
  const [forgot_mode, set_forgot_mode] = useState(false)
  const [message, set_message] = useState('')
  const [error, set_error] = useState('')
  const [show_password, set_show_password] = useState(false)

  useEffect(() => {
    let active = true

    async function initialize() {
      try {
        const { data: session_data } = await get_user_session()

        if (!active) return

        set_loading(false)

        get_website_information().then((information) => {
          if (!active) return
          const values = Object.fromEntries((information ?? []).map((item) => [item.information_key, item.information_value]))
          set_site_name(read_setting(information, ['village_name', 'website_name'], ''))
          set_logo_url(read_setting(information, ['logo_url'], ''))
        }).catch(() => {})

        if (session_data.session?.user) {
          const role = await get_user_role(session_data.session.user.id)
          if (role?.role_key === 'user') {
            navigate('/user', { replace: true })
            return
          }
          if (role?.role_key) {
            navigate('/admin', { replace: true })
            return
          }
        }
      } catch {
        if (active) set_error('Unable to load login page.')
      } finally {
        if (active) set_loading(false)
      }
    }

    initialize()
    return () => { active = false }
  }, [navigate])

  async function submit(event) {
    event.preventDefault()
    set_error('')
    set_message('')
    set_submitting(true)

    try {
      const { error: sign_in_error } = await sign_in_user({
        email: email.trim(),
        password
      })

      if (sign_in_error) {
        set_error(sign_in_error.message || 'Invalid email or password.')
        return
      }

      const { data } = await get_user_session()
      const user_id = data.session?.user?.id

      if (!user_id) {
        set_error('Login succeeded, but the user session could not be loaded.')
        return
      }

      const role = await get_user_role(user_id)

      if (!role?.role_key) {
        set_error('Your account does not have an assigned role.')
        return
      }

      if (role.role_key === 'user') {
        navigate('/user', { replace: true })
        return
      }

      if (['admin', 'editor', 'manager', 'moderator'].includes(role.role_key)) {
        navigate('/admin', { replace: true })
        return
      }

      set_error('Your account role is not allowed to access this area.')
    } catch (login_error) {
      set_error(login_error?.message || 'Unable to complete login.')
    } finally {
      set_submitting(false)
    }
  }

  async function forgot_password(event) {
    event.preventDefault()
    set_error('')
    set_message('')

    if (!email.trim()) {
      set_error('Enter your email address first.')
      return
    }

    set_submitting(true)

    try {
      const { error: reset_error } = await reset_user_password(email.trim())
      if (reset_error) {
        set_error(reset_error.message || 'Unable to send the password reset email.')
        return
      }
      set_message('Password reset instructions have been sent to your email.')
    } catch (reset_error) {
      set_error(reset_error?.message || 'Unable to send the password reset email.')
    } finally {
      set_submitting(false)
    }
  }

  if (loading) {
    return createElement(
      'main',
      { className: 'login-page' },
      createElement('section', { className: 'login-shell login-loading', 'aria-label': 'Loading login' },
        createElement('div', { className: 'login-brand' },
          createElement('div', { className: 'login-logo login-logo-placeholder', 'aria-hidden': 'true' }, 'D'),
          createElement('div', { className: 'login-skeleton login-skeleton-title' }),
          createElement('p', null, 'Loading...')
        ),
        createElement('div', { className: 'login-form' },
          createElement('div', { className: 'login-skeleton login-skeleton-input' }),
          createElement('div', { className: 'login-skeleton login-skeleton-input' }),
          createElement('div', { className: 'login-skeleton login-skeleton-button' })
        )
      )
    )
  }

  return createElement(
    'main',
    { className: 'login-page' },
    createElement(
      'section',
      { className: 'login-shell' },
      createElement(
        'div',
        { className: 'login-brand' },
        logo_url
          ? createElement('img', { src: logo_url, alt: site_name || 'Website logo', className: 'login-logo' })
          : createElement('div', { className: 'login-logo login-logo-placeholder', 'aria-hidden': 'true' }, 'D'),
        site_name ? createElement('h1', null, site_name) : null,
        createElement('p', null, forgot_mode ? 'Reset your password' : 'Sign in to continue')
      ),
      forgot_mode
        ? createElement(
            'form',
            { className: 'login-form', onSubmit: forgot_password },
            createElement('label', null,
              'Email address',
              createElement('input', {
                type: 'email',
                value: email,
                onChange: (event) => set_email(event.target.value),
                autoComplete: 'email',
                placeholder: 'Enter your email',
                required: true
              })
            ),
            error ? createElement('p', { className: 'login-error', role: 'alert' }, error) : null,
            message ? createElement('p', { className: 'login-success', role: 'status' }, message) : null,
            createElement('button', { type: 'submit', disabled: submitting }, submitting ? 'Sending...' : 'Send reset link'),
            createElement('button', {
              type: 'button',
              className: 'login-secondary-button',
              onClick: () => { set_forgot_mode(false); set_error(''); set_message('') }
            }, 'Back to login')
          )
        : createElement(
            'form',
            { className: 'login-form', onSubmit: submit },
            createElement('label', null,
              'Email address',
              createElement('input', {
                type: 'email',
                value: email,
                onChange: (event) => set_email(event.target.value),
                autoComplete: 'email',
                inputMode: 'email',
                placeholder: 'Enter your email',
                required: true
              })
            ),
            createElement('label', null,
              'Password',
              createElement('div', { className: 'login-password-field' },
                createElement('input', {
                  type: show_password ? 'text' : 'password',
                  value: password,
                  onChange: (event) => set_password(event.target.value),
                  autoComplete: 'current-password',
                  placeholder: 'Enter your password',
                  required: true,
                  minLength: 8
                }),
                createElement('button', {
                  type: 'button',
                  className: 'login-password-toggle',
                  onClick: () => set_show_password((value) => !value),
                  'aria-label': show_password ? 'Hide password' : 'Show password'
                }, show_password ? 'Hide' : 'Show')
              )
            ),
            error ? createElement('p', { className: 'login-error', role: 'alert' }, error) : null,
            message ? createElement('p', { className: 'login-success', role: 'status' }, message) : null,
            createElement('button', { type: 'submit', disabled: submitting }, submitting ? 'Signing in...' : 'Login'),
            createElement('button', {
              type: 'button',
              className: 'login-forgot-button',
              onClick: () => { set_forgot_mode(true); set_error(''); set_message('') }
            }, 'Forgot password?')
          )
    )
  )
}
