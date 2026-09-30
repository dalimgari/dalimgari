import { createElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sign_in_user, sign_up_user, get_user_session, reset_user_password } from '../../controller/user/user_auth_controller'
import { get_user_role } from '../../controller/user/user_permission_controller'
import { get_website_information } from '../../service/supabase/website_service.js'

function read_setting(settings, keys, fallback = '') {
  for (const key of keys) {
    const item = settings.find((entry) => (entry.information_key ?? entry.setting_key) === key)
    if (item?.information_value !== undefined && item?.information_value !== null) {
      const value = typeof item.information_value === 'object' ? item.information_value.value ?? item.information_value.bn ?? item.information_value.en : item.information_value
      if (value) return String(value)
    }
    if (item?.setting_value !== undefined && item?.setting_value !== null) {
      const value = typeof item.setting_value === 'object' ? item.setting_value.value ?? item.setting_value.bn ?? item.setting_value.en : item.setting_value
      if (value) return String(value)
    }
  }
  return fallback
}

export function login_page() {
  const navigate = useNavigate()
  const [email, set_email] = useState('')
  const [display_name, set_display_name] = useState('')
  const [password, set_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [site_name, set_site_name] = useState('')
  const [logo_url, set_logo_url] = useState('')
  const [loading, set_loading] = useState(true)
  const [submitting, set_submitting] = useState(false)
  const [forgot_mode, set_forgot_mode] = useState(false)
  const [signup_mode, set_signup_mode] = useState(false)
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
          set_site_name(read_setting(information, ['village_name', 'website_name'], ''))
          set_logo_url(read_setting(information, ['logo_url', 'website_logo'], ''))
        }).catch(() => {})

        if (session_data.session?.user) {
          const role = await get_user_role(session_data.session.user.id)
          if (role?.role_key === 'user') navigate('/user', { replace: true })
          else if (role?.role_key) navigate('/admin', { replace: true })
        }
      } catch {
        if (active) set_error('লগইন পেজ লোড করা যায়নি।')
      } finally {
        if (active) set_loading(false)
      }
    }

    initialize()
    return () => { active = false }
  }, [navigate])

  async function signup(event) {
    event.preventDefault(); set_error(''); set_message('')
    if (!display_name.trim()) { set_error('আপনার নাম লিখুন।'); return }
    if (password.length < 8) { set_error('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।'); return }
    if (password !== confirm_password) { set_error('দুটি পাসওয়ার্ড একই নয়।'); return }
    set_submitting(true)
    try {
      const { data, error: signup_error } = await sign_up_user({
        email: email.trim(),
        password,
        display_name: display_name.trim()
      })
      if (signup_error) {
        set_error(signup_error.message?.toLowerCase().includes('already') ? 'এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে।' : 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।')
        return
      }
      if (data.session?.user) {
        set_message('অ্যাকাউন্ট তৈরি হয়েছে। এখন আপনি প্রবেশ করতে পারবেন।')
        set_signup_mode(false)
        set_password('')
        set_confirm_password('')
      } else {
        set_message('অ্যাকাউন্ট তৈরি হয়েছে। আপনার ইমেইল যাচাই করে তারপর লগইন করুন।')
      }
    } catch { set_error('অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন.') }
    finally { set_submitting(false) }
  }

  async function submit(event) {
    event.preventDefault(); set_error(''); set_message(''); set_submitting(true)
    try {
      const { error: sign_in_error } = await sign_in_user({ email: email.trim(), password })
      if (sign_in_error) { set_error('ইমেইল বা পাসওয়ার্ড সঠিক নয়।'); return }
      const { data } = await get_user_session(); const user_id = data.session?.user?.id
      if (!user_id) { set_error('লগইন হয়েছে, কিন্তু সেশন পাওয়া যায়নি।'); return }
      const role = await get_user_role(user_id)
      if (!role?.role_key) { set_error('আপনার অ্যাকাউন্টে কোনো ভূমিকা নির্ধারিত নেই।'); return }
      if (role.role_key === 'user') { navigate('/user', { replace: true }); return }
      if (['admin', 'editor', 'manager', 'moderator'].includes(role.role_key)) { navigate('/admin', { replace: true }); return }
      set_error('এই অ্যাকাউন্টের জন্য প্রবেশের অনুমতি নেই।')
    } catch { set_error('লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।') }
    finally { set_submitting(false) }
  }

  async function forgot_password(event) {
    event.preventDefault(); set_error(''); set_message('')
    if (!email.trim()) { set_error('আগে আপনার ইমেইল ঠিকানা লিখুন।'); return }
    set_submitting(true)
    try {
      const { error: reset_error } = await reset_user_password(email.trim())
      if (reset_error) { set_error('পাসওয়ার্ড রিসেট লিংক পাঠানো যায়নি।'); return }
      set_message('পাসওয়ার্ড পরিবর্তনের নির্দেশনা আপনার ইমেইলে পাঠানো হয়েছে।')
    } catch { set_error('পাসওয়ার্ড রিসেট করা যায়নি। আবার চেষ্টা করুন।') }
    finally { set_submitting(false) }
  }

  if (loading) return createElement('main', { className: 'login-page' }, createElement('section', { className: 'login-shell login-loading', 'aria-label': 'Loading login' }, createElement('div', { className: 'login-skeleton login-skeleton-logo' }), createElement('div', { className: 'login-skeleton login-skeleton-title' }), createElement('div', { className: 'login-skeleton login-skeleton-input' }), createElement('div', { className: 'login-skeleton login-skeleton-input' }), createElement('div', { className: 'login-skeleton login-skeleton-button' })))

  return createElement('main', { className: 'login-page' }, createElement('section', { className: 'login-shell' },
    createElement('div', { className: 'login-brand' },
      logo_url ? createElement('img', { src: logo_url, alt: site_name || 'Website logo', className: 'login-logo' }) : createElement('div', { className: 'login-logo login-logo-placeholder', 'aria-hidden': 'true' }, 'D'),
      site_name ? createElement('h1', null, site_name) : null,
      createElement('p', null, forgot_mode ? 'পাসওয়ার্ড পরিবর্তন করুন' : signup_mode ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'আপনার অ্যাকাউন্টে প্রবেশ করুন')
    ),
    createElement('nav', { className: 'login-navigation', 'aria-label': 'Authentication navigation' },
      createElement('button', { type: 'button', className: 'login-back-button', onClick: () => navigate('/') }, '← মূল ওয়েবসাইটে ফিরে যান')
    ),
    forgot_mode ? createElement('form', { className: 'login-form', onSubmit: forgot_password },
      createElement('label', null, 'ইমেইল ঠিকানা', createElement('input', { type: 'email', value: email, onChange: (event) => set_email(event.target.value), autoComplete: 'email', inputMode: 'email', placeholder: 'আপনার ইমেইল লিখুন', required: true })),
      error ? createElement('p', { className: 'login-error', role: 'alert' }, error) : null,
      message ? createElement('p', { className: 'login-success', role: 'status' }, message) : null,
      createElement('button', { type: 'submit', disabled: submitting }, submitting ? 'পাঠানো হচ্ছে…' : 'রিসেট লিংক পাঠান'),
      createElement('button', { type: 'button', className: 'login-secondary-button', onClick: () => { set_forgot_mode(false); set_error(''); set_message('') } }, 'লগইনে ফিরে যান')
    ) : signup_mode ? createElement('form', { className: 'login-form', onSubmit: signup },
      createElement('label', null, 'আপনার নাম', createElement('input', { type: 'text', value: display_name, onChange: (event) => set_display_name(event.target.value), autoComplete: 'name', placeholder: 'আপনার নাম লিখুন', required: true })),
      createElement('label', null, 'ইমেইল ঠিকানা', createElement('input', { type: 'email', value: email, onChange: (event) => set_email(event.target.value), autoComplete: 'email', inputMode: 'email', placeholder: 'আপনার ইমেইল লিখুন', required: true })),
      createElement('label', null, 'পাসওয়ার্ড', createElement('input', { type: 'password', value: password, onChange: (event) => set_password(event.target.value), autoComplete: 'new-password', placeholder: 'কমপক্ষে ৮ অক্ষর', required: true, minLength: 8 })),
      createElement('label', null, 'পাসওয়ার্ড আবার লিখুন', createElement('input', { type: 'password', value: confirm_password, onChange: (event) => set_confirm_password(event.target.value), autoComplete: 'new-password', placeholder: 'পাসওয়ার্ড আবার লিখুন', required: true, minLength: 8 })),
      error ? createElement('p', { className: 'login-error', role: 'alert' }, error) : null,
      message ? createElement('p', { className: 'login-success', role: 'status' }, message) : null,
      createElement('button', { type: 'submit', disabled: submitting }, submitting ? 'অ্যাকাউন্ট তৈরি হচ্ছে…' : 'অ্যাকাউন্ট তৈরি করুন'),
      createElement('button', { type: 'button', className: 'login-secondary-button', onClick: () => { set_signup_mode(false); set_error(''); set_message('') } }, 'লগইনে ফিরে যান')
    ) : createElement('form', { className: 'login-form', onSubmit: submit },
      createElement('label', null, 'ইমেইল ঠিকানা', createElement('input', { type: 'email', value: email, onChange: (event) => set_email(event.target.value), autoComplete: 'email', inputMode: 'email', placeholder: 'আপনার ইমেইল লিখুন', required: true })),
      createElement('label', null, 'পাসওয়ার্ড', createElement('div', { className: 'login-password-field' }, createElement('input', { type: show_password ? 'text' : 'password', value: password, onChange: (event) => set_password(event.target.value), autoComplete: 'current-password', placeholder: 'আপনার পাসওয়ার্ড লিখুন', required: true, minLength: 8 }), createElement('button', { type: 'button', className: 'login-password-toggle', onClick: () => set_show_password((value) => !value), 'aria-label': show_password ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন' }, show_password ? 'লুকান' : 'দেখুন'))),
      error ? createElement('p', { className: 'login-error', role: 'alert' }, error) : null,
      message ? createElement('p', { className: 'login-success', role: 'status' }, message) : null,
      createElement('button', { type: 'submit', disabled: submitting }, submitting ? 'প্রবেশ করা হচ্ছে…' : 'লগইন'),
      createElement('button', { type: 'button', className: 'login-forgot-button', onClick: () => { set_forgot_mode(true); set_error(''); set_message('') } }, 'পাসওয়ার্ড ভুলে গেছেন?'),
      createElement('button', { type: 'button', className: 'login-secondary-button', onClick: () => { set_signup_mode(true); set_error(''); set_message('') } }, 'নতুন অ্যাকাউন্ট তৈরি করুন')
    )
  ))
}
