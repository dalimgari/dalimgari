import { createElement, useState } from 'react'
import { update_current_user_profile } from '../../controller/user/user_profile_controller'
import { global_auto_input } from '../form/global_auto_input'

export function user_profile_form({ profile = {} }) {
  const [display_name, set_display_name] = useState(profile.display_name ?? '')
  const [profile_image_url, set_profile_image_url] = useState(profile.profile_image_url ?? '')
  const [message, set_message] = useState('')

  async function save_profile(event) {
    event.preventDefault()
    try {
      await update_current_user_profile({ display_name, profile_image_url })
      set_message('Profile updated')
    } catch {
      set_message('Unable to update profile')
    }
  }

  return createElement('form', { onSubmit: save_profile, className: 'user-profile-form' },
    createElement(global_auto_input, { field_name: 'display_name', label: 'Display Name', value: display_name, on_change: set_display_name }),
    createElement(global_auto_input, { field_name: 'profile_image_url', label: 'Profile Image', value: profile_image_url, on_change: set_profile_image_url }) ,
    createElement('button', { type: 'submit' }, 'Save'),
    createElement('span', null, message)
  )
}
