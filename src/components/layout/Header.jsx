import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { supabase } from '../../lib/supabase'
import { appPath } from '../../lib/routes'
import { searchPublicContent } from '../../services/searchService'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')

  const { t } = useGlobalLabels()
  const text = (key, fallbackBn) => t(key, fallbackBn)

  const isRoleProfile = /^\/(admin|manager|editor|moderator|user)\/profile$/.test(canonicalPath)
  const isSecureArea = canonicalPath === '/profile' || canonicalPath === '/dashboard' || canonicalPath.startsWith('/admin') || canonicalPath.startsWith('/manage') || isRoleProfile
  const showLogout = status === 'ready' && !!user && isSecureArea
  const dashboardHref = status === 'ready' && user ? appPath('/dashboard') : appPath('/login')

  useEffect(() => {
    if (!showSearch || !searchOpen) return undefined
    const query = searchTerm.trim()
    if (!query) {
      setSearchResults([])
      setSearchStatus('idle')
      return undefined
    }
    let active = true
    const timer = window.setTimeout(async () => {
      setSearchStatus('loading')
      try {
        const results = await searchPublicContent(query, { limit: 12 })
        if (active) {
          setSearchResults(results)
          setSearchStatus('ready')
        }
      } catch {
        if (active) {
          setSearchResults([])
          setSearchStatus('error')
        }
      }
    }, 220)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [searchTerm, searchOpen, showSearch])

  useEffect(() => {
    if (!showSearch) {
      setSearchOpen(false)
      setSearchTerm('')
      setSearchResults([])
      setSearchStatus('idle')
    }
  }, [showSearch])

  function toggleSearch() {
    setSearchOpen((open) => {
      if (open) {
        setSearchTerm('')
        setSearchResults([])
        setSearchStatus('idle')
      }
      return !open
    })
  }

  const menuLabel = sidebarOpen ? text('close', 'বন্ধ') : text('menu', 'উঠান')
  const searchLabel = text('search', 'খোঁজ')
  const searchPlaceholder = text('search_placeholder', 'এখানে খুঁজুন')
  const loginLabel = user ? text('dashboard', 'ড্যাশবোর্ড') : text('login', 'লগইন')
  const searchRightStyle = searchOpen ? { flex: '1 1 auto', minWidth: 0, marginLeft: 'auto' } : undefined
  const searchBoxStyle = searchOpen ? { width: '100%', maxWidth: '26rem', flex: '0 1 26rem' } : undefined

  return (
    <header className={'site-header' + (searchOpen ? ' search-mode' : '')}>
      <div className="site-container site-header__inner">
        <button className={'site-header__action site-header__menu' + (sidebarOpen ? ' is-open' : '')} type="button" onClick={onMenu} aria-label={menuLabel} aria-expanded={sidebarOpen}>
          <RuralIcon name={sidebarOpen ? 'close' : 'menu'} />
          <span>{menuLabel}</span>
        </button>

        {showBrand ? (
          <div className={'site-brand' + (searchOpen ? ' is-search-hidden' : '')} aria-label={pageTitle || text('home', 'হোম')}>
            <span className="site-brand__words"><span className="site-brand__name">{pageTitle || text('home', 'হোম')}</span></span>
          </div>
        ) : <div className="site-brand" aria-hidden="true" />}

        <div className={'site-header__right' + (searchOpen ? ' search-expanded' : '')} style={searchRightStyle}>
          <div className={'header-search' + (searchOpen ? ' is-open' : '')} style={searchBoxStyle}>
            <div className="header-search__control">
              {searchOpen ? (
                <input className="header-search__input" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={searchPlaceholder} aria-label={searchLabel} autoComplete="off" autoFocus />
              ) : null}
              <button className="site-header__action header-search__button" type="button" onClick={toggleSearch} aria-label={searchOpen ? text('close', 'বন্ধ') : searchLabel} aria-expanded={searchOpen}>
                <RuralIcon name={searchOpen ? 'close' : 'search'} />
                <span>{searchOpen ? text('close', 'বন্ধ') : searchLabel}</span>
              </button>
            </div>

            {searchOpen ? (
              <div className="header-search__results" role="listbox" aria-label={text('search', 'খোঁজার ফলাফল')}>
                {searchTerm.trim() ? (
                  <>
                    {searchStatus === 'loading' ? <div className="header-search__state">{text('search_loading', 'খোঁজা হচ্ছে…')}</div> : null}
                    {searchStatus === 'error' ? <div className="header-search__state">{text('search_error', 'খোঁজার সময় সমস্যা হয়েছে।')}</div> : null}
                    {searchStatus === 'ready' && !searchResults.length ? <div className="header-search__state">{text('search_no_results', 'কোনো মিল পাওয়া যায়নি।')}</div> : null}
                    {searchResults.map((result) => (
                      <a className="header-search__result" role="option" href={appPath(result.href)} key={result.type + '-' + result.id}>
                        <span className="header-search__result-type">{result.type === 'page' ? text('page', 'পেজ') : text('post', 'পোস্ট')}</span>
                        <strong>{result.title}</strong>
                        {result.description ? <span>{String(result.description).replace(/\s+/g, ' ').trim().slice(0, 90)}{String(result.description).trim().length > 90 ? '…' : ''}</span> : null}
                      </a>
                    ))}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>


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
  )
}
