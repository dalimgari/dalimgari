import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { usePreferences } from '../../context/PreferencesContext'
import { supabase } from '../../lib/supabase'
import { appPath } from '../../lib/routes'
import { searchPublicContent } from '../../services/searchService'

function RuralIcon({ name }) { const paths={back:<><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,close:<><path d="M5 5l14 14M19 5 5 19"/></>,search:<><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>,user:<><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5"/></>,logout:<><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,hut:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v5h6v-5"/></>};return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--theme-icon-stroke-width,1.7)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg> }

export default function Header({ pageTitle, onMenu, sidebarOpen, labels = {}, showSearch = false, canonicalPath = '/', showBrand = true }) {
  const { user, status } = useAuth()
  const { language } = usePreferences()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')

  const text=(key, fallbackBn, fallbackEn=fallbackBn)=>{
    const item=labels[key]
    return language==='eng' ? (item?.eng||fallbackEn) : (item?.bng||item?.eng||fallbackBn)
  }
  const isRoleProfile = /^\/(admin|manager|editor|moderator|user)\/profile$/.test(canonicalPath)
  const isSecureArea = canonicalPath === '/profile' || canonicalPath.startsWith('/admin') || isRoleProfile
  const showLogout = status === 'ready' && !!user && isSecureArea
  const dashboardHref = status === 'ready' && user ? appPath('/dashboard') : appPath('/login')
  async function handleLogout() { try { await supabase.auth.signOut() } catch {} }
  const menuLabel=sidebarOpen?text('close','বন্ধ','Close'):text('menu','উঠান','Menu')
  const searchLabel=text('search','খোঁজ','Search')
  const searchPlaceholder=text('searchPlaceholder','এখানে খুঁজুন','Search Here')
  const loginLabel=user?text('dashboard','ড্যাশবোর্ড','Dashboard'):text('login','বাড়ি','Login')

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
        if (active) { setSearchResults(results); setSearchStatus('ready') }
      } catch {
        if (active) { setSearchResults([]); setSearchStatus('error') }
      }
    }, 220)
    return () => { active = false; window.clearTimeout(timer) }
  }, [searchTerm, searchOpen, showSearch])

  useEffect(() => {
    if (!showSearch) {
      setSearchOpen(false)
      setSearchTerm('')
      setSearchResults([])
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

  const searchRightStyle = searchOpen ? { flex: '0 0 auto', minWidth: 0, marginLeft: 'auto' } : undefined
  const searchBoxStyle = searchOpen ? { width: 'min(26rem, 100%)', maxWidth: '26rem', flex: '0 1 26rem' } : undefined

  return <header className={`site-header${searchOpen ? ' search-mode' : ''}`}><div className="site-container site-header__inner"><button className={`site-header__action site-header__menu${sidebarOpen?' is-open':''}`} type="button" onClick={onMenu} aria-label={menuLabel} aria-expanded={sidebarOpen}><RuralIcon name={sidebarOpen?'close':'menu'}/><span>{menuLabel}</span></button>{showBrand ? <div className={`site-brand${searchOpen ? ' is-search-hidden' : ''}`} aria-label={pageTitle || text('home','হোম','Home')}><span className="site-brand__words"><span className="site-brand__name">{pageTitle || text('home','হোম','Home')}</span></span></div> : <div className="site-brand" aria-hidden="true" />}<div className={`site-header__right${searchOpen ? ' search-expanded' : ''}`} style={searchRightStyle}>{showSearch ? <div className={`header-search${searchOpen?' is-open':''}`} style={searchBoxStyle}><div className="header-search__control">{searchOpen ? <input className="header-search__input" style={{ border: '0', borderTop: '0', borderLeft: '0', borderRight: '0', outline: 'none', boxShadow: 'none' }} type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={searchPlaceholder} aria-label={searchLabel} autoComplete="off" autoFocus /> : null}<button className="site-header__action header-search__button" type="button" onClick={toggleSearch} aria-label={searchOpen ? text('close','বন্ধ','Close') : searchLabel} aria-expanded={searchOpen}><RuralIcon name={searchOpen?'close':'search'}/><span>{searchOpen ? text('close','বন্ধ','Close') : searchLabel}</span></button></div>{searchOpen && searchTerm.trim() ? <div className="header-search__results" role="listbox" aria-label={text('search','খোঁজার ফলাফল','Search results')}>{searchStatus === 'loading' ? <div className="header-search__state">খোঁজা হচ্ছে…</div> : null}{searchStatus === 'error' ? <div className="header-search__state">খোঁজার সময় সমস্যা হয়েছে।</div> : null}{searchStatus === 'ready' && !searchResults.length ? <div className="header-search__state">কোনো মিল পাওয়া যায়নি।</div> : null}{searchResults.map((result) => <a className="header-search__result" role="option" href={appPath(result.href)} key={result.type + '-' + result.id}><span className="header-search__result-type">{result.type === 'page' ? 'পেজ' : 'পোস্ট'}</span><strong>{result.title}</strong>{result.description ? <span>{String(result.description).replace(/\s+/g,' ').trim().slice(0,90)}{String(result.description).trim().length > 90 ? '…' : ''}</span> : null}</a>)}</div> : null}</div> : null}{showLogout ? <button className="site-header__action" type="button" onClick={handleLogout} aria-label={text('logout','লগআউট','Logout')}><RuralIcon name="logout"/><span>{text('logout','লগআউট','Logout')}</span></button> : null}<a className="site-header__action" href={dashboardHref} aria-label={loginLabel}><RuralIcon name={user ? 'hut' : 'user'}/><span>{loginLabel}</span></a></div></div></header>
}
