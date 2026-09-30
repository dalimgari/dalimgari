import { createElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../service/supabase/supabase_client'

export function reset_password_page() {
  const navigate = useNavigate()
  const [password, set_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [message, set_message] = useState('')
  const [error, set_error] = useState('')
  const [submitting, set_submitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    set_error('')
    set_message('')

    if (password.length < 6) {
      set_error('Password must contain at least 6 characters.')
      return
    }

    if (password !== confirm_password) {
      set_error('Passwords do not match.')
      return
    }

    set_submitting(true)

    try {
      const { error: update_error } = await supabase.auth.updateUser({ password })
      if (update_error) {
        set_error(update_error.message || 'Unable to update the password.')
        return
      }

      set_message('Password updated successfully.')
      set_password('')
      set_confirm_password('')
    } catch (update_error) {
      set_error(update_error?.message || 'Unable to update the password.')
    } finally {
      set_submitting(false)
    }
  }

  return createElement(
    'main',
    { className: 'login-page' },
    createElement(
      'section',
      { className: 'login-shell' },
      createElement('div', { className: 'login-brand' },
        createElement('p', null, 'Set a new password')
      ),
      createElement(
        'form',
        { className: 'login-form', onSubmit: submit },
        createElement('label', null,
          'New password',
          createElement('input', {
            type: 'password',
            value: password,
            onChange: (event) => set_password(event.target.value),
            autoComplete: 'new-password',
            required: true,
            minLength: 6
          })
        ),
        createElement('label', null,
          'Confirm password',
          createElement('input', {
            type: 'password',
            value: confirm_password,
            onChange: (event) => set_confirm_password(event.target.value),
            autoComplete: 'new-password',
            required: true,
            minLength: 6
          })
        ),
        error ? createElement('p', { className: 'login-error', role: 'alert' }, error) : null,
        message ? createElement('p', { className: 'login-success', role: 'status' }, message) : null,
        createElement('button', { type: 'submit', disabled: submitting }, submitting ? 'Updating...' : 'Update password'),
        createElement('button', {
          type: 'button',
          className: 'login-secondary-button',
          onClick: () => navigate('/login', { replace: true })
        }, 'Back to login')
      )
    )
  )
}
