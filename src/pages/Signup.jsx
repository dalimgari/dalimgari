import { useState } from 'react'
import { Layout } from '../components/layout'
import { ErrorState, Loading } from '../components/ui'
import { signUpWithPassword } from '../services/authService'
import { appPath } from '../lib/routes'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError(null)
    setMessage(null)
    try {
      const data = await signUpWithPassword(email.trim(), password)
      setMessage(data.user?.identities?.length === 0
        ? 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট আছে।'
        : 'একাউন্ট তৈরি হয়েছে। প্রয়োজন হলে ইমেইল যাচাই করুন, তারপর লগইন করুন।')
      setStatus('ready')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  return <Layout navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }]}>
    <section className="login-page"><div className="site-container login-page__container"><div className="login-card">
      <h1>নতুন একাউন্ট</h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label htmlFor="signup-email">ইমেইল</label>
        <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <label htmlFor="signup-password">পাসওয়ার্ড</label>
        <input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        <button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'অপেক্ষা করুন…' : 'একাউন্ট বানান'}</button>
        <a className="ui-button ui-button--secondary" href={appPath('/login')}>লগইনে ফিরে যান</a>
        <a className="ui-button ui-button--secondary" href={appPath('/')}>হোমে ফিরে যান</a>
      </form>
      {status === 'loading' ? <Loading /> : null}
      {message ? <p className="admin-success">{message}</p> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'একাউন্ট তৈরি করা যায়নি।'} /> : null}
    </div></div></section>
  </Layout>
}
