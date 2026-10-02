import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { Button, ErrorState, Loading } from '../components/ui'
import { signUpWithPassword } from '../services/authService'
import { appPath } from '../lib/routes'
import { useAuth } from '../context'

function friendlySignupError(error) {
  const message = String(error?.message || '')
  if (/already registered|already exists|user already/i.test(message)) {
    return 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট আছে। লগইন পেজ থেকে প্রবেশ করুন।'
  }
  if (/password/i.test(message) && /weak|least|characters|should contain/i.test(message)) {
    return 'পাসওয়ার্ডটি আরও শক্তিশালী দিন। অন্তত ৮ অক্ষরের পাসওয়ার্ড ব্যবহার করুন।'
  }
  if (/invalid.*email|email.*invalid/i.test(message)) {
    return 'সঠিক ইমেইল ঠিকানা দিন।'
  }
  return message || 'একাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।'
}

export default function Signup() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const { user, status: authStatus } = useAuth()

  useEffect(() => {
    if (authStatus === 'ready' && user) {
      setMessage('আপনি ইতিমধ্যে লগইন করা আছেন। নতুন একাউন্ট তৈরির প্রয়োজন নেই।')
    }
  }, [authStatus, user])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = displayName.trim()

    if (password.length < 8) {
      setError(new Error('পাসওয়ার্ডটি অন্তত ৮ অক্ষরের হতে হবে।'))
      setStatus('error')
      return
    }

    if (password !== confirmPassword) {
      setError(new Error('দুইটি পাসওয়ার্ড এক নয়।'))
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const data = await signUpWithPassword(normalizedEmail, password, normalizedName)
      const alreadyRegistered = data.user?.identities?.length === 0

      if (alreadyRegistered) {
        setMessage('এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট আছে।')
      } else if (data.session) {
        setMessage('একাউন্ট তৈরি হয়েছে। এখন আপনি লগইন করা আছেন।')
      } else {
        setMessage('একাউন্ট তৈরি হয়েছে। আপনার ইমেইলে যাচাইয়ের লিংক পাঠানো হয়ে থাকলে সেটি যাচাই করে লগইন করুন।')
      }
      setStatus('ready')
    } catch (requestError) {
      setError(new Error(friendlySignupError(requestError)))
      setStatus('error')
    }
  }

  return <Layout navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }]}>
    <section className="login-page">
      <div className="site-container login-page__container">
        <div className="login-card">
          <h1>নতুন একাউন্ট</h1>
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="signup-name">নাম</label>
            <input
              id="signup-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              maxLength={120}
              placeholder="আপনার নাম"
            />

            <label htmlFor="signup-email">ইমেইল</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              inputMode="email"
            />

            <label htmlFor="signup-password">পাসওয়ার্ড</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <label htmlFor="signup-confirm-password">পাসওয়ার্ড আবার দিন</label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button type="submit" className="ui-button" disabled={status === 'loading' || Boolean(user)}>
              {status === 'loading' ? 'অপেক্ষা করুন…' : 'একাউন্ট তৈরি করুন'}
            </button>
            <Button onClick={() => { window.location.href = appPath('/login') }}>লগইন</Button>
            <Button variant="secondary" onClick={() => { window.location.href = appPath('/') }}>হোম</Button>
          </form>

          {status === 'loading' ? <Loading /> : null}
          {message ? <p className="admin-success" role="status" aria-live="polite">{message}</p> : null}
          {status === 'error' ? <ErrorState description={error?.message || 'একাউন্ট তৈরি করা যায়নি।'} /> : null}
        </div>
      </div>
    </section>
  </Layout>
}
