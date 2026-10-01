import { appPath } from '../../lib/routes'

function RuralIcon({ name }) { const paths={back:<><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,search:<><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>,user:<><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5"/></>,hut:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/></>};return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg> }

export default function Header({ siteName, slogan, onMenu }) {
  function goBack(){if(window.history.length>1)window.history.back();else window.location.href=appPath('/')}
  return <header className="site-header"><div className="site-container site-header__inner">
    <button className="site-header__action" type="button" onClick={goBack} aria-label="পেছনে ফিরে যান"><RuralIcon name="back"/><span>পেছনে</span></button>
    <button className="site-header__action" type="button" onClick={onMenu} aria-label="মেনু খুলুন"><RuralIcon name="menu"/><span>মেনু</span></button>
    <a className="site-brand" href={appPath('/')} aria-label="হোম"><span className="site-brand__mark"><RuralIcon name="hut"/></span><span className="site-brand__words"><span className="site-brand__name">{siteName}</span>{slogan?<span className="site-brand__slogan">{slogan}</span>:null}</span></a>
    <div className="site-header__right"><a className="site-header__action" href={appPath('/search')} aria-label="সার্চ"><RuralIcon name="search"/><span>সার্চ</span></a><a className="site-header__action" href={appPath('/login')} aria-label="লগইন"><RuralIcon name="user"/><span>লগইন</span></a></div>
  </div></header>
}
