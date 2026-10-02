import { useAuth } from '../../context'
import { supabase } from '../../lib/supabase'
import { appPath } from '../../lib/routes'

function RuralIcon({ name }) { const paths={back:<><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,close:<><path d="M5 5l14 14M19 5 5 19"/></>,search:<><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>,user:<><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5"/></>,logout:<><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,hut:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v5h6v-5"/></>};return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--theme-icon-stroke-width,1.7)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg> }

export default function Header({ pageTitle, onMenu, sidebarOpen, labels = {}, showSearch = false, canonicalPath = '/', showBrand = true }) {
  const { user, status } = useAuth()
  const text=(key, fallback)=>labels[key]?.bng||labels[key]?.eng||fallback
  const isSecureArea = canonicalPath === '/profile' || canonicalPath.startsWith('/admin')
  const showLogout = status === 'ready' && !!user && isSecureArea
  const loginHref = status === 'ready' && user ? appPath('/admin') : appPath('/login')
  async function handleLogout() {
    try { await supabase.auth.signOut() } catch {}
  }
  return <header className="site-header"><div className="site-container site-header__inner"><button className={`site-header__action site-header__menu${sidebarOpen?' is-open':''}`} type="button" onClick={onMenu} aria-label={sidebarOpen?text('close','বন্ধ'):text('menu','উঠান')} aria-expanded={sidebarOpen}><RuralIcon name={sidebarOpen?'close':'menu'}/><span>{sidebarOpen?text('close','বন্ধ'):text('menu','উঠান')}</span></button>{showBrand ? <div className="site-brand" aria-label={pageTitle || text('home','হোম')}><span className="site-brand__words"><span className="site-brand__name">{pageTitle || text('home','হোম')}</span></span></div> : <div className="site-brand" aria-hidden="true" />}<div className="site-header__right">{showSearch ? <a className="site-header__action" href={appPath('/search')} aria-label={text('search','খোঁজ')}><RuralIcon name="search"/><span>{text('search','খোঁজ')}</span></a> : null}{showLogout ? <button className="site-header__action" type="button" onClick={handleLogout} aria-label={text('logout','লগআউট')}><RuralIcon name="logout"/><span>{text('logout','লগআউট')}</span></button> : null}<a className="site-header__action" href={loginHref} aria-label={user ? text('dashboard','ড্যাশবোর্ড') : text('login','বাড়ি')}><RuralIcon name={user ? 'hut' : 'user'}/><span>{user ? text('dashboard','ড্যাশবোর্ড') : text('login','বাড়ি')}</span></a></div></div></header>
}