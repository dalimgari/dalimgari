import { useAuth } from '../context'

export default function ControlPanel() {
  const { user, status } = useAuth()
  if (status === 'loading') return <p>লোড হচ্ছে…</p>
  if (!user) {
    window.location.href = '/login'
    return null
  }
  return <main className="home-section"><div className="site-container"><h1>ড্যাশবোর্ড</h1><p>{user.email}</p></div></main>
}
