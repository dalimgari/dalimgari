import { useEffect, useState } from 'react'
import { appPath } from '../../lib/routes'

const LABELS = {
  'হোম': 'Home', 'তথ্য': 'Information', 'পোস্ট': 'Posts', 'অ্যালবাম': 'Albums', 'সার্চ': 'Search',
}

export default function Navigation({ items = [] }) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('dalimgari-theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('dalimgari-language') || 'bn')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('dalimgari-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en'
    localStorage.setItem('dalimgari-language', language)
  }, [language])

  const translatedItems = items.map((item) => ({ ...item, label: language === 'en' ? (LABELS[item.label] || item.label) : item.label }))
  const hasSearch = items.some((item) => item.href === '/search')
  const hasLogin = items.some((item) => item.href === '/login')
  const extra = [
    ...(!hasSearch ? [{ label: language === 'en' ? 'Search' : 'সার্চ', href: '/search' }] : []),
    ...(!hasLogin ? [{ label: language === 'en' ? 'Login' : 'লগইন', href: '/login' }] : []),
  ]

  return (
    <nav className="site-nav" aria-label={language === 'en' ? 'Main navigation' : 'প্রধান নেভিগেশন'}>
      <div className="site-container site-nav__inner">
        <button className="site-nav__toggle" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((value) => !value)}>
          {open ? '✕' : '☰'} <span className="sr-only">{open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}</span>
        </button>
        <div id="site-menu" className={`site-nav__menu${open ? ' is-open' : ''}`}>
          {[...translatedItems, ...extra].map((item) => (
            <a key={item.href} className="site-nav__link" href={appPath(item.href)} onClick={() => setOpen(false)}>{item.label}</a>
          ))}
          <a className="site-nav__link site-nav__profile" href={appPath('/profile')} onClick={() => setOpen(false)}>{language === 'en' ? 'Profile' : 'প্রোফাইল'}</a>
          <button className="site-nav__control" type="button" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} aria-label="থিম পরিবর্তন">
            {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button className="site-nav__control" type="button" onClick={() => setLanguage((value) => value === 'bn' ? 'en' : 'bn')} aria-label="ভাষা পরিবর্তন">
            {language === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>
      </div>
    </nav>
  )
}
