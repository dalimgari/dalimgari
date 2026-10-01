import { useEffect, useState } from 'react'
import { signOut } from '../../services/authService'
import { getWebsiteInformation } from '../../services/websiteService'
import { hasPermission } from '../../services/permissionService'
import { Button } from '../ui'
import { appPath } from '../../lib/routes'

const adminNavItems = [
  { label: 'ওয়েবসাইট তথ্য', path: '/admin/website-information', permission: 'settings_manage' },
  { label: 'পেজসমূহ', path: '/admin/pages', permission: 'content_manage' },
  { label: 'পোস্ট', path: '/admin/posts', permission: 'content_manage' },
  { label: 'অ্যালবাম', path: '/admin/albums', permission: 'content_manage' },
  { label: 'মিডিয়া', path: '/admin/media', permission: 'media_manage' },
  { label: 'ইউজার', path: '/admin/users', permission: 'user_manage' },
  { label: 'অডিট', path: '/admin/audit', permission: 'audit_view' },
]

export default function AdminLayout({ user, title, children }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [visibleNav, setVisibleNav] = useState([])
  const [siteName, setSiteName] = useState(null)

  useEffect(() => {
    let active = true

    async function loadNavigation() {
      try {
        const results = await Promise.all(adminNavItems.map(async (item) => ({ ...item, allowed: await hasPermission(item.permission) })))
        if (active) setVisibleNav(results.filter((item) => item.allowed))
      } catch {
        if (active) setVisibleNav([])
      }
    }

    async function loadWebsiteIdentity() {
      try {
        const information = await getWebsiteInformation()
        if (active) setSiteName(information?.village_name || null)
      } catch {
        if (active) setSiteName(null)
      }
    }

    loadNavigation()
    loadWebsiteIdentity()
    return () => { active = false }
  }, [user?.id])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
      window.location.href = appPath('/login')
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
            <h1 className="admin-header__title">{siteName ? `${siteName} নিয়ন্ত্রণ প্যানেল` : 'নিয়ন্ত্রণ প্যানেল'}</h1>
          </div>
          <Button variant="secondary" disabled={loggingOut} onClick={handleLogout}>{loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}</Button>
        </div>
      </header>
      <nav className="admin-nav" aria-label="অ্যাডমিন নেভিগেশন">
        <div className="site-container admin-nav__inner">
          <a href={appPath('/admin')}>ড্যাশবোর্ড</a>
          {visibleNav.map((item) => <a key={item.path} href={appPath(item.path)}>{item.label}</a>)}
          <span className="admin-nav__user">{user?.email || ''}</span>
        </div>
      </nav>
      <main className="admin-main"><div className="site-container">{title ? <h2 className="admin-page-title">{title}</h2> : null}{children}</div></main>
    </div>
  )
}
