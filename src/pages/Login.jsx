import { useState } from 'react'
import { Layout } from '../components/layout'
import { ErrorState, Loading } from '../components/ui'
import { signInWithPassword } from '../services/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      await signInWithPassword(email.trim(), password)
      window.location.href = '/admin'
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  return (
    <Layout>
      <section className="home-section"><div className="site-container">
        <h1>অ্যাডমিন লগইন</h1>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">ইমেইল</label>
          <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <label htmlFor="admin-password">পাসওয়ার্ড</label>
          <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <button type="submit" disabled={status === 'loading'}>লগইন</button>
        </form>
        {status === 'loading' ? <Loading /> : null}
        {status === 'error' ? <ErrorState description={error?.message || 'লগইন করা যায়নি।'} /> : null}
      </div></section>
    </Layout>
  )
}
