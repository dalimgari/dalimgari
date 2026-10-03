import { useState } from 'react'
import { ROUTES, appPath } from '../../lib/routes'
import { usePreferences } from '../../context/PreferencesContext'
import KeyIcon from '../ui/KeyIcon'
import { useGlobalLabels } from '../../context'

function iconKeyFor(label, href) {
  if (href === ROUTES.home) return 'home'
  if (href === ROUTES.information) return 'information'
  if (href === ROUTES.posts) return 'posts'
  if (href === ROUTES.albums) return 'albums'
  if (href === ROUTES.search) return 'search'
  if (href === ROUTES.profile) return 'profile'
  if (href === ROUTES.login) return 'login'
  return null
}

export default function Navigation({ items = [] }) {
  const [open, setOpen] = useState(false)
  const { theme, language, setThemePreference, setLanguagePreference } = usePreferences()
  const { t } = useGlobalLabels()

  const translatedItems = items.map((item) => ({
    ...item,
    label: (() => {
      const keys = { ROUTES.home: 'home', ROUTES.information: 'information', ROUTES.posts: 'posts', ROUTES.albums: 'albums', ROUTES.search: 'search', ROUTES.profile: 'profile', ROUTES.login: 'login' }
      const key = keys[item.href]
      return key ? t(key, item.label, item.label) : item.label
    })(),
  }))
  const hasSearch = items.some((item) => item.href === ROUTES.search)
  const hasLogin = items.some((item) => item.href === ROUTES.login)
  const extra = [
    ...(!hasSearch ? [{ label: t('search', 'খুঁজুন', 'Search'), href: ROUTES.search }] : []),
    ...(!hasLogin ? [{ label: t('login', 'লগইন', 'Login'), href: ROUTES.login }] : []),
  ]

  const link = (item) => (
    <a key={item.href} className="site-nav__link" href={appPath(item.href)} onClick={() => setOpen(false)}>
      <KeyIcon iconKey={iconKeyFor(item.label, item.href)} />
      <span>{item.label}</span>
    </a>
  )

  return (
    <nav className="site-nav" aria-label={t('village_navigation', 'প্রধান নেভিগেশন', 'Main navigation')}>
      <div className="site-container site-nav__inner">
        <button className="site-nav__toggle" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((value) => !value)}>
          <KeyIcon iconKey={open ? 'close' : 'menu'} />
          <span>{open ? t('close', 'বন্ধ', 'Close') : t('menu', 'উঠান', 'Menu')}</span>
          <span className="sr-only">{open ? t('close_village_menu', 'মেনু বন্ধ করুন', 'Close menu') : t('village_menu', 'মেনু খুলুন', 'Open menu')}</span>
        </button>
        <div id="site-menu" className={`site-nav__menu${open ? ' is-open' : ''}`}>
          {[...translatedItems, ...extra].map(link)}
          <a className="site-nav__link site-nav__profile" href={appPath(ROUTES.profile)} onClick={() => setOpen(false)}>
            <KeyIcon iconKey="profile" /><span>{t('profile', 'প্রোফাইল', 'Profile')}</span>
          </a>
          <button className="site-nav__control" type="button" onClick={() => setThemePreference(theme === 'dark' ? 'light' : 'dark')} aria-label={t('theme', 'থিম পরিবর্তন', 'Change theme')}>
            <KeyIcon iconKey="theme" />
            <span>{theme === 'dark' ? t('day', 'আলো', 'Day') : t('night', 'রাত', 'Night')}</span>
          </button>
          <button className="site-nav__control" type="button" onClick={() => setLanguagePreference(language === 'bng' ? 'eng' : 'bng')} aria-label={t('language', 'ভাষা পরিবর্তন', 'Change language')}>
            <KeyIcon iconKey="language" /><span>{language === 'bng' ? t('english', 'English', 'English') : t('bengali', 'বাংলা', 'Bengali')}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
