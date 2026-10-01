import { useEffect, useState } from 'react'
import { signOut } from '../../services/authService'
import { getWebsiteInformation } from '../../services/websiteService'
import { hasPermission } from '../../services/permissionService'
import { Button } from '../ui'
import { appPath } from '../../lib/routes'

const adminNavItems = [
  { label: 'ড্যাশবোর্ড', path: '/admin', permission: null },
  { label: 'ওয়েবসাইট তথ্য', path: '/admin/website-information', permission: 'settings_manage' },
  { label: 'পেজসমূহ', path: '/admin/pages', permission: 'content_manage' },
  { label: 'পোস্ট', path: '/admin/posts', permission: 'content_manage' },
  { label: 'অ্যালবাম', path: '/admin/albums', permission: 'media_manage' },
  { label: 'মিডিয়া', path: '/admin/media', permission: 'media_manage' },
  { label: 'ইউজার', path: '/admin/users', permission: 'user_manage' },
  { label: 'অডিট', path: '/admin/audit', permission: 'audit_view' },
]

export default function AdminLayout({ user, title, children }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [visibleNav, setVisibleNav] = useState([])
  const [siteName, setSiteName] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    async function loadNavigation() {
      try {
        const results = await Promise.all(adminNavItems.map(async (item) => ({ ...item, allowed: !item.permission || await hasPermission(item.permission) })))
        if (active) setVisibleNav(results.filter((item) => item.allowed))
      } catch { if (active) setVisibleNav([]) }
    }
    async function loadWebsiteIdentity() {
      try { const information = await getWebsiteInformation(); if (active) setSiteName(information?.village_name || null) }
      catch { if (active) setSiteName(null) }
    }
    loadNavigation(); loadWebsiteIdentity()
    return () => { active = false }
  }, [user?.id])

  async function handleLogout() {
    setLoggingOut(true)
    try { await signOut(); window.location.href = appPath('/login') }
    catch { setLoggingOut(false) }
  }

  return <div className="admin-layout">
    <header className="admin-header"><div className="site-container admin-header__inner">
      <div className="admin-header__identity">
        <button className="admin-sidebar-toggle" type="button" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? '✕' : '☰'} <span className="sr-only">অ্যাডমিন মেনু</span></button>
        <div><p className="admin-header__eyebrow">অ্যাডমিন</p><h1 className="admin-header__title">{siteName ? `${siteName} নিয়ন্ত্রণ প্যানেল` : 'নিয়ন্ত্রণ প্যানেল'}</h1></div>
      </div>
      <div className="admin-header__actions"><a className="ui-button ui-button--secondary" href={appPath('/profile')}>প্রোফাইল</a><Button variant="secondary" disabled={loggingOut} onClick={handleLogout}>{loggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট'}</Button></div>
    </div></header>
    <div className="admin-body">
      <aside id="admin-sidebar" className={`admin-sidebar${menuOpen ? ' is-open' : ''}`}>
        <nav className="admin-sidebar__nav" aria-label="অ্যাডমিন নেভিগেশন">
          {visibleNav.map((item) => <a key={item.path} href={appPath(item.path)} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          <a href={appPath('/')} onClick={() => setMenuOpen(false)}>সাইট দেখুন</a>
        </nav>
        <p className="admin-nav__user">{user?.email || ''}</p>
      </aside>
      {menuOpen ? <button className="admin-sidebar-backdrop" type="button" aria-label="মেনু বন্ধ করুন" onClick={() => setMenuOpen(false)} /> : null}
      <main className="admin-main"><div className="site-container">{title ? <h2 className="admin-page-title">{title}</h2> : null}{children}</div></main>
    </div>
  </div>
}
