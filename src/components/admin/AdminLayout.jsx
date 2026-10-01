import { useState } from 'react'
import { signOut } from '../../services/authService'
import { Button } from '../ui'

export default function AdminLayout({ user, title, children }) {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      setLoggingOut(false)
      window.alert(error?.message || 'লগআউট করা যায়নি।')
    }
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="site-container admin-header__inner">
          <div>
            <p className="admin-header__eyebrow">অ্যাডমিন</p>
            <h1 className="admin-header__title">দালিমগাড়ী নিয়ন্ত্রণ প্যানেল</h1>
          </div>
          <Button variant="secondary" disabled={loggingOut} onClick={handleLogout}>
            {loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}
          </Button>
        </div>
      </header>
      <nav className="admin-nav" aria-label="অ্যাডমিন নেভিগেশন">
        <div className="site-container admin-nav__inner">
          <a href="/admin">ড্যাশবোর্ড</a>
          <a href="/admin/website-information">ওয়েবসাইট তথ্য</a>
          <a href="/admin/pages">পেজসমূহ</a>
          <span className="admin-nav__user">{user?.email || ''}</span>
        </div>
      </nav>
      <main className="admin-main">
        <div className="site-container">
          {title ? <h2 className="admin-page-title">{title}</h2> : null}
          {children}
        </div>
      </main>
    </div>
  )
}
