import { useState } from 'react'
import { Layout } from '../components/layout'
import { ErrorState, Loading } from '../components/ui'
import { signInWithPassword, resetPasswordForEmail } from '../services/authService'
import { appPath } from '../lib/routes'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError(null)
    setMessage(null)

    try {
      if (mode === 'reset') {
        await resetPasswordForEmail(email.trim())
        setMessage('পাসওয়ার্ড পরিবর্তনের লিংক আপনার ইমেইলে পাঠানো হয়েছে।')
      } else {
        await signInWithPassword(email.trim(), password)
        window.location.href = appPath('/admin')
      }
      setStatus('ready')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  return (
    <Layout>
      <section className="home-section"><div className="site-container">
        <h1>{mode === 'reset' ? 'পাসওয়ার্ড পরিবর্তন' : 'অ্যাডমিন লগইন'}</h1>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">ইমেইল</label>
          <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          {mode === 'login' ? (
            <>
              <label htmlFor="admin-password">পাসওয়ার্ড</label>
              <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </>
          ) : null}
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'অপেক্ষা করুন…' : mode === 'reset' ? 'রিসেট লিংক পাঠান' : 'লগইন'}
          </button>
          <button type="button" className="ui-button ui-button--secondary" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(null); setMessage(null) }} disabled={status === 'loading'}>
            {mode === 'login' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'লগইনে ফিরে যান'}
          </button>
        </form>
        {status === 'loading' ? <Loading /> : null}
        {message ? <p className="admin-success">{message}</p> : null}
        {status === 'error' ? <ErrorState description={error?.message || 'অনুরোধটি সম্পন্ন করা যায়নি।'} /> : null}
      </div></section>
    </Layout>
  )
}
