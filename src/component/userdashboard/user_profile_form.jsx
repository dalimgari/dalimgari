import { createElement, useState } from 'react'
import { update_current_user_profile } from '../../controller/user/user_profile_controller'

export function user_profile_form({ profile = {} }) {
  const [display_name, set_display_name] = useState(profile.display_name ?? '')
  const [message, set_message] = useState('')

  async function save_profile(event) {
    event.preventDefault()
    try {
      await update_current_user_profile({ display_name })
      set_message('Profile updated')
    } catch {
      set_message('Unable to update profile')
    }
  }

  return createElement('form', { onSubmit: save_profile, className: 'user-profile-form' },
    createElement('label', null, 'Display Name', createElement('input', { value: display_name, onChange: (event) => set_display_name(event.target.value) })),
    createElement('button', { type: 'submit' }, 'Save'),
    createElement('span', null, message)
  )
}
