import { useState } from 'react'
import { appPath } from '../../lib/routes'
import { usePreferences } from '../../context/PreferencesContext'

const LABELS = {
  'হোম': 'Home',
  'তথ্য': 'Information',
  'পোস্ট': 'Posts',
  'অ্যালবাম': 'Albums',
  'সার্চ': 'Search',
}

function RuralIcon({ name }) {
  const shapes = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/></>,
    info: <><path d="M12 21c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9Z"/><path d="M12 10v6"/><path d="M12 7h.01"/></>,
    post: <><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    album: <><path d="M4 6h16v14H4z"/><path d="m7 17 4-4 3 3 2-2 3 3"/><circle cx="9" cy="10" r="1"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>,
    user: <><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></>,
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    leaf: <><path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-6 10-16Z"/><path d="M5 20c2-5 6-8 11-10"/></>,
  }
  return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>
}

function iconFor(label, href) {
  if (href === '/') return 'home'
  if (href === '/information') return 'info'
  if (href === '/posts') return 'post'
  if (href === '/albums') return 'album'
  if (href === '/search') return 'search'
  if (href === '/profile') return 'user'
  return 'leaf'
}

export default function Navigation({ items = [] }) {
  const [open, setOpen] = useState(false)
  const { theme, language, setThemePreference, setLanguagePreference } = usePreferences()

  const translatedItems = items.map((item) => ({
    ...item,
    label: language === 'eng' ? (LABELS[item.label] || item.label) : item.label,
  }))
  const hasSearch = items.some((item) => item.href === '/search')
  const hasLogin = items.some((item) => item.href === '/login')
  const extra = [
    ...(!hasSearch ? [{ label: language === 'eng' ? 'Search' : 'সার্চ', href: '/search' }] : []),
    ...(!hasLogin ? [{ label: language === 'eng' ? 'Login' : 'লগইন', href: '/login' }] : []),
  ]

  const link = (item) => (
    <a key={item.href} className="site-nav__link" href={appPath(item.href)} onClick={() => setOpen(false)}>
      <RuralIcon name={iconFor(item.label, item.href)} />
      <span>{item.label}</span>
    </a>
  )

  return (
    <nav className="site-nav" aria-label={language === 'eng' ? 'Main navigation' : 'প্রধান নেভিগেশন'}>
      <div className="site-container site-nav__inner">
        <button className="site-nav__toggle" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((value) => !value)}>
          <RuralIcon name={open ? 'close' : 'menu'} />
          <span>{open ? 'বন্ধ করুন' : 'মেনু'}</span>
          <span className="sr-only">{open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}</span>
        </button>
        <div id="site-menu" className={`site-nav__menu${open ? ' is-open' : ''}`}>
          {[...translatedItems, ...extra].map(link)}
          <a className="site-nav__link site-nav__profile" href={appPath('/profile')} onClick={() => setOpen(false)}>
            <RuralIcon name="user" /><span>{language === 'eng' ? 'Profile' : 'প্রোফাইল'}</span>
          </a>
          <button className="site-nav__control" type="button" onClick={() => setThemePreference(theme === 'dark' ? 'light' : 'dark')} aria-label="থিম পরিবর্তন">
            <RuralIcon name={theme === 'dark' ? 'sun' : 'moon'} />
            <span>{theme === 'dark' ? 'আলো' : 'রাত'}</span>
          </button>
          <button className="site-nav__control" type="button" onClick={() => setLanguagePreference(language === 'bng' ? 'eng' : 'bng')} aria-label="ভাষা পরিবর্তন">
            <RuralIcon name="leaf" /><span>{language === 'bng' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
