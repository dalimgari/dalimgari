import { useRef } from 'react'
import { useAuth } from '../../context'
import { supabase } from '../../lib/supabase'
import { appPath } from '../../lib/routes'
import Search from '../search/Search'
import ProfileAvatar from '../ui/ProfileAvatar'
import { useGlobalLabels } from '../../context'

const ICONS = {
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="M5 5l14 14M19 5 5 19" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
}

function RuralIcon({ name }) {
  return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--theme-icon-stroke-width,1.7)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name] || ICONS.menu}</svg>
}

export default function Header({ pageTitle, onMenu, sidebarOpen, labels = {}, showSearch = true, canonicalPath = '/', showBrand = true }) {
  const { user, status } = useAuth()
  const { t } = useGlobalLabels()
  const text = (key, fallbackBn) => t(key, fallbackBn)

  const isRoleProfile = /^\/(admin|manager|editor|moderator|user)\/profile$/.test(canonicalPath)
  const isSecureArea = canonicalPath === '/profile' || canonicalPath === '/dashboard' || canonicalPath.startsWith('/admin') || canonicalPath.startsWith('/manage') || isRoleProfile
  const showLogout = status === 'ready' && !!user && isSecureArea
  const dashboardHref = status === 'ready' && user ? appPath('/dashboard') : appPath('/login')

  const menuLabel = sidebarOpen ? text('close', 'বন্ধ') : text('menu', 'উঠান')
    const loginLabel = user ? text('dashboard', 'ড্যাশবোর্ড') : text('login', 'লগইন')
  return (
    <>
      <header className="site-header">
        <div className="site-container site-header__inner">
          <button className={'site-header__action site-header__menu' + (sidebarOpen ? ' is-open' : '')} type="button" onClick={onMenu} aria-label={menuLabel} aria-expanded={sidebarOpen}>
            <RuralIcon name={sidebarOpen ? 'close' : 'menu'} />
            <span>{menuLabel}</span>
          </button>

          {showBrand ? (
            <div className="site-brand" aria-label={pageTitle || text('home', 'হোম')}>
              <span className="site-brand__words"><span className="site-brand__name">{pageTitle || text('home', 'হোম')}</span></span>
            </div>
          ) : <div className="site-brand" aria-hidden="true" />}

          <div className="site-header__right">
            {showSearch ? <Search /> : null}

            {showLogout ? (
              <button className="site-header__action" type="button" onClick={() => supabase.auth.signOut().catch(() => {})} aria-label={text('logout', 'লগআউট')}>
                <RuralIcon name="logout" /><span>{text('logout', 'লগআউট')}</span>
              </button>
            ) : null}

            <a className="site-header__action site-header__profile-action" href={dashboardHref} aria-label={loginLabel} title={loginLabel}>
              <ProfileAvatar user={user} />
            </a>
          </div>
        </div>
      </header>
