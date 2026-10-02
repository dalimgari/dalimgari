import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { ErrorState, Loading } from '../components/ui'
import { supabase } from '../lib/supabase'
import { signInWithPassword, signInWithOAuth, resetPasswordForEmail, updatePassword } from '../services/authService'
import { appPath } from '../lib/routes'
import { useAuth } from '../context'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const { user, status: authStatus } = useAuth()

  useEffect(() => {
    if (authStatus === 'ready' && user && mode === 'login') window.location.replace(appPath('/admin'))
  }, [authStatus, user, mode])

  useEffect(() => {
    if (!supabase) return undefined
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('new-password'); setPassword(''); setStatus('idle'); setError(null); setMessage('নতুন পাসওয়ার্ড দিন।')
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault(); setStatus('loading'); setError(null); setMessage(null)
    try {
      if (mode === 'reset') await resetPasswordForEmail(email.trim()).then(() => setMessage('পাসওয়ার্ড পরিবর্তনের লিংক আপনার ইমেইলে পাঠানো হয়েছে।'))
      else if (mode === 'new-password') { await updatePassword(password); setMessage('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।'); setTimeout(() => { window.location.href = appPath('/admin') }, 300) }
      else { await signInWithPassword(email.trim(), password); window.location.href = appPath('/admin') }
      setStatus('ready')
    } catch (requestError) { setError(requestError); setStatus('error') }
  }

  async function handleOAuth() {
    setStatus('loading'); setError(null); setMessage(null)
    try { await signInWithOAuth('google') } catch (requestError) { setError(requestError); setStatus('error') }
  }

  const isRecovery = mode === 'new-password'
  return <Layout navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }]}>
    <section className="login-page"><div className="site-container login-page__container"><div className="login-card">
      <h1>{mode === 'reset' ? 'পাসওয়ার্ড পরিবর্তন' : isRecovery ? 'নতুন পাসওয়ার্ড সেট করুন' : 'লগইন'}</h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        {mode === 'login' ? <a className="login-home-link" href={appPath('/')}>হোমে ফিরে যান</a> : null}
        {mode !== 'new-password' ? <><label htmlFor="admin-email">ইমেইল</label><input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></> : null}
        {mode !== 'reset' ? <><label htmlFor="admin-password">পাসওয়ার্ড</label><input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={isRecovery ? 'new-password' : 'current-password'} /></> : null}
        <button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'অপেক্ষা করুন…' : mode === 'reset' ? 'রিসেট লিংক পাঠান' : isRecovery ? 'নতুন পাসওয়ার্ড সংরক্ষণ করুন' : 'লগইন'}</button>
        {!isRecovery && mode === 'login' ? <button type="button" className="ui-button ui-button--secondary" onClick={handleOAuth} disabled={status === 'loading'}>Google দিয়ে লগইন</button> : null}
        {!isRecovery ? <>
          <button type="button" className="ui-button ui-button--secondary" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(null); setMessage(null) }} disabled={status === 'loading'}>{mode === 'login' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'লগইনে ফিরে যান'}</button>
          {mode === 'login' ? <a className="ui-button" href={appPath('/signup')}>নতুন একাউন্ট বানান</a> : null}
        </> : null}
      </form>
      {status === 'loading' ? <Loading /> : null}
      {message ? <p className="admin-success">{message}</p> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'অনুরোধটি সম্পন্ন করা যায়নি।'} /> : null}
      </div></div></section>
  </Layout>
}
