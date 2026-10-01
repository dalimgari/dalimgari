import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { ErrorState, Loading } from '../components/ui'
import { getCurrentProfile, getCurrentUser } from '../services/profileService'
import { signOut } from '../services/authService'
import { appPath } from '../lib/routes'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  async function load() {
    setStatus('loading'); setError(null)
    try { const [currentUser, currentProfile] = await Promise.all([getCurrentUser(), getCurrentProfile()]); setUser(currentUser); setProfile(currentProfile); setStatus('ready') }
    catch (requestError) { setError(requestError); setStatus('error') }
  }

  useEffect(() => { load() }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try { await signOut(); window.location.href = appPath('/login') }
    catch (requestError) { setError(requestError); setLoggingOut(false) }
  }

  return <Layout navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }, { label: 'সার্চ', href: '/search' }]}>
    <section className="home-section"><div className="site-container">
      <a className="back-link" href={appPath('/')}>← হোমে ফিরে যান</a>
      <h1>প্রোফাইল</h1>
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'প্রোফাইল লোড করা যায়নি।'} onRetry={load} /> : null}
      {status === 'ready' ? <section className="content-card profile-card">
        <dl className="info-grid">
          <div className="info-card"><dt>নাম</dt><dd>{profile?.display_name || 'নাম দেওয়া হয়নি'}</dd></div>
          <div className="info-card"><dt>ইমেইল</dt><dd>{user?.email || '—'}</dd></div>
          <div className="info-card"><dt>অ্যাকাউন্ট</dt><dd>{user?.created_at ? new Date(user.created_at).toLocaleDateString('bn-BD') : '—'}</dd></div>
        </dl>
        <div className="admin-form__actions"><button className="ui-button ui-button--secondary" type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}</button></div>
      </section> : null}
    </div></section>
  </Layout>
}
