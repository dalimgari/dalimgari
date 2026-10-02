import { useEffect, useState } from 'react'
import { signOut } from '../../services/authService'
import { hasPermission } from '../../services/permissionService'
import { Button } from '../ui'
import { appPath } from '../../lib/routes'
import Layout from '../layout/Layout'

const adminNavItems = [
  { label: 'ড্যাশবোর্ড', path: '/admin', permission: null },
  { label: 'হোমপেজ ম্যানেজমেন্ট', path: '/admin/homepage', permission: 'homepage_manage' },
  { label: 'সাইডবার ম্যানেজমেন্ট', path: '/admin/sidebar', permission: 'sidebar_manage' },
  { label: 'ওয়েবসাইট তথ্য', path: '/admin/website-information', permission: 'settings_manage' },
  { label: 'পেজসমূহ', path: '/admin/pages', permission: 'content_manage' },
  { label: 'পোস্ট', path: '/admin/posts', permission: 'content_manage' },
  { label: 'অ্যালবাম', path: '/admin/albums', permission: 'media_manage' },
  { label: 'মিডিয়া', path: '/admin/media', permission: 'media_manage' },
  { label: 'ইউজার', path: '/admin/users', permission: 'user_manage' },
  { label: 'অডিট', path: '/admin/audit', permission: 'audit_view' },
  { label: 'পরিসংখ্যান', path: '/admin/analytics', permission: 'audit_view' },
]

export default function AdminLayout({ user, title, children }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [visibleNav, setVisibleNav] = useState([])

  useEffect(() => {
    let active = true
    Promise.all(
      adminNavItems.map(async (item) => ({
        ...item,
        allowed: !item.permission || await hasPermission(item.permission),
      })),
    )
      .then((results) => {
        if (active) setVisibleNav(results.filter((item) => item.allowed))
      })
      .catch(() => {
        if (active) setVisibleNav([])
      })
    return () => { active = false }
  }, [user?.id])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
      window.location.href = appPath('/login')
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <Layout seoTitle={title}>
      <section className="home-section admin-page-shell">
        <div className="site-container">
          <div className="admin-page-toolbar">
            <div>
              {title ? <h1>{title}</h1> : null}
              <p className="admin-intro">নিয়ন্ত্রণ প্যানেল</p>
            </div>
            <div className="admin-header__actions">
              <a className="ui-button ui-button--secondary" href={appPath('/profile')}>প্রোফাইল</a>
              <Button variant="secondary" disabled={loggingOut} onClick={handleLogout}>
                {loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}
              </Button>
            </div>
          </div>

          <nav className="admin-inline-nav" aria-label="অ্যাডমিন নেভিগেশন">
            {visibleNav.map((item) => (
              <a key={item.path} href={appPath(item.path)}>{item.label}</a>
            ))}
            <a href={appPath('/')}>সাইট দেখুন</a>
          </nav>

          <div className="admin-main-content">
            {children}
          </div>
        </div>
      </section>
    </Layout>
  )
}
