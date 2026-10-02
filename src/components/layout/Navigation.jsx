import { useState } from 'react'
import { appPath } from '../../lib/routes'
import { usePreferences } from '../../context/PreferencesContext'
import KeyIcon from '../ui/KeyIcon'

const LABELS = {
  'হোম': 'Home',
  'তথ্য': 'Information',
  'পোস্ট': 'Posts',
  'অ্যালবাম': 'Albums',
  'সার্চ': 'Search',
}

function iconKeyFor(label, href) {
  if (href === '/') return 'home'
  if (href === '/information') return 'information'
  if (href === '/posts') return 'posts'
  if (href === '/albums') return 'albums'
  if (href === '/search') return 'search'
  if (href === '/profile') return 'profile'
  if (href === '/login') return 'login'
  return null
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
      <KeyIcon iconKey={iconKeyFor(item.label, item.href)} />
      <span>{item.label}</span>
    </a>
  )

  return (
    <nav className="site-nav" aria-label={language === 'eng' ? 'Main navigation' : 'প্রধান নেভিগেশন'}>
      <div className="site-container site-nav__inner">
        <button className="site-nav__toggle" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((value) => !value)}>
          <KeyIcon iconKey={open ? 'close' : 'menu'} />
          <span>{open ? 'বন্ধ করুন' : 'মেনু'}</span>
          <span className="sr-only">{open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}</span>
        </button>
        <div id="site-menu" className={`site-nav__menu${open ? ' is-open' : ''}`}>
          {[...translatedItems, ...extra].map(link)}
          <a className="site-nav__link site-nav__profile" href={appPath('/profile')} onClick={() => setOpen(false)}>
            <KeyIcon iconKey="profile" /><span>{language === 'eng' ? 'Profile' : 'প্রোফাইল'}</span>
          </a>
          <button className="site-nav__control" type="button" onClick={() => setThemePreference(theme === 'dark' ? 'light' : 'dark')} aria-label="থিম পরিবর্তন">
            <KeyIcon iconKey="theme" />
            <span>{theme === 'dark' ? 'আলো' : 'রাত'}</span>
          </button>
          <button className="site-nav__control" type="button" onClick={() => setLanguagePreference(language === 'bng' ? 'eng' : 'bng')} aria-label="ভাষা পরিবর্তন">
            <KeyIcon iconKey="language" /><span>{language === 'bng' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
