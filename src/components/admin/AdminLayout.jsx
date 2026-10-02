import { useEffect, useState } from 'react'
import { hasPermission } from '../../services/permissionService'
import { appPath } from '../../lib/routes'
import Layout from '../layout/Layout'
import { Button } from '../ui'

const adminNavItems = [
  { label: 'ড্যাশবোর্ড', path: '/admin', permission: null },
  { label: 'হোমপেজ ম্যানেজমেন্ট', path: '/admin/homepage', permission: 'homepage_manage' },
  { label: 'সাইডবার ম্যানেজমেন্ট', path: '/admin/sidebar', permission: 'sidebar_manage' },
  { label: 'ওয়েবসাইট তথ্য', path: '/admin/website-information', permission: 'settings_manage' },
  { label: 'পেজসমূহ', path: '/admin/pages', permission: 'content_manage' },
  { label: 'পোস্ট', path: '/admin/posts', permission: 'content_manage' },
  { label: 'অ্যালবাম', path: '/admin/albums', permission: 'media_manage' },
  { label: 'মিডিয়া', path: '/admin/media', permission: 'media_manage' },
  { label: 'ডাটাবেজ ও স্টোরেজ', path: '/admin/database-storage', permission: 'settings_manage' },
  { label: 'ইউজার', path: '/admin/users', permission: 'user_manage' },
  { label: 'অডিট', path: '/admin/audit', permission: 'audit_view' },
  { label: 'পরিসংখ্যান', path: '/admin/analytics', permission: 'audit_view' },
]

function navigate(path) {
  const target = appPath(path)
  const current = window.location.pathname
  if (current === target) return
  window.history.pushState({}, '', target)
  window.dispatchEvent(new Event('app:navigate'))
}

export default function AdminLayout({ user, title, children }) {
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

  return (
    <Layout seoTitle={title}>
      <section className="home-section admin-page-shell">
        <div className="site-container">
          <nav className="admin-inline-nav" aria-label="অ্যাডমিন মডিউল">
            {visibleNav.map((item) => {
                const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
                const itemPath = appPath(item.path).replace(/\/$/, '') || '/'
              const isActive = currentPath === itemPath
              return <Button
                key={item.path}
                type="button"
                variant={isActive ? 'primary' : 'secondary'}
                className="admin-module-button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(item.path)}
              >{item.label}</Button>
            })}
          </nav>

          <div className="admin-main-content">
            {children}
          </div>
        </div>
      </section>
    </Layout>
  )
}
