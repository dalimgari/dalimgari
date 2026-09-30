import { createElement, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'

export function user_account_settings() {
  const [password, set_password] = useState('')
  const [message, set_message] = useState('')

  async function update_password(event) {
    event.preventDefault()
    const { error } = await supabase.auth.updateUser({ password })
    set_message(error ? 'Unable to update password' : 'Password updated')
    if (!error) set_password('')
  }

  return createElement('form', { onSubmit: update_password, className: 'user-account-settings' },
    createElement('label', null, 'New Password', createElement('input', { type: 'password', value: password, onChange: (event) => set_password(event.target.value), minLength: 8, required: true })),
    createElement('button', { type: 'submit' }, 'Update Password'),
    createElement('span', null, message)
  )
}
