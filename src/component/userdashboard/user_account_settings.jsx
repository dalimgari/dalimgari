import { createElement, useState } from 'react'
import { supabase } from '../../service/supabase/supabase_client'
import { global_auto_input } from '../form/global_auto_input'

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
    createElement(global_auto_input, { field_name: 'password', label: 'New Password', value: password, on_change: set_password, input_method: 'text', type: 'password', minLength: 8, required: true }),
    createElement('button', { type: 'submit' }, 'Update Password'),
    createElement('span', null, message)
  )
}
