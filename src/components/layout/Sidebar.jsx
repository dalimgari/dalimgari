import { usePreferences } from '../../context/PreferencesContext'
import { appPath } from '../../lib/routes'

const ICONS = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V20h13v-9.5" /><path d="M9 20v-5h6v5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></>,
  post: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  album: <><path d="M4 6h16v14H4z" /><path d="m7 17 4-4 3 3 2-2 3 3" /><circle cx="9" cy="10" r="1" /></>,
  page: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h6M8 16h7" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  login: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" /></>,
  profile: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" /></>,
}

function RuralIcon({ name }) {
  return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--theme-icon-stroke-width,1.7)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name] || ICONS.page}</svg>
}

const ENGLISH_LABELS = {
  'হোম': 'Home',
  'তথ্য': 'Information',
  'পোস্ট': 'Posts',
  'অ্যালবাম': 'Albums',
  'সার্চ': 'Search',
  'লগইন': 'Login',
  'প্রোফাইল': 'Profile',
}

function iconKeyFor(item) {
  const href = item?.href || ''
  if (href === '/') return 'home'
  if (href === '/information') return 'info'
  if (href === '/posts') return 'post'
  if (href === '/albums') return 'album'
  if (href === '/search') return 'search'
  if (href === '/login') return 'login'
  if (href === '/profile') return 'profile'
  return 'page'
}

export default function Sidebar({ items = [], open, onClose }) {
  const { theme, language, setThemePreference, setLanguagePreference } = usePreferences()
  const targetLanguageLabel = language === 'bng' ? 'English' : 'বাংলা'
  const translatedItems = items.map((item) => ({ ...item, label: language === 'eng' ? (ENGLISH_LABELS[item.label] || item.label) : item.label }))
  const homeItem = translatedItems.find((item) => item.href === '/') || { label: language === 'eng' ? 'Home' : 'হোম', href: '/' }
  const menuItems = translatedItems.filter((item) => item.href !== '/')

  function toggleTheme() {
    setThemePreference(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <button data-no-translate="true" className={'rural-sidebar__backdrop' + (open ? ' is-visible' : '')} aria-label={language === 'eng' ? 'Close village menu' : 'উঠান বন্ধ করুন'} onClick={onClose} />
      <aside className={'rural-sidebar' + (open ? ' is-open' : '')} aria-label={language === 'eng' ? 'Village menu' : 'গ্রামের উঠান'}>
        <a className="rural-sidebar__home" href={appPath(homeItem.href)} onClick={onClose} aria-current={window.location.pathname.endsWith('/') ? 'page' : undefined}>
          <RuralIcon name="home" />
          <span>{homeItem.label}</span>
        </a>

        <nav className="rural-sidebar__nav" aria-label={language === 'eng' ? 'Village navigation' : 'গ্রামের নেভিগেশন'}>
          {menuItems.map((item) => (
            <a key={item.href} href={appPath(item.href)} onClick={onClose} aria-current={window.location.pathname === appPath(item.href) ? 'page' : undefined}>
              <RuralIcon name={iconKeyFor(item)} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="rural-sidebar__tools">
          <button type="button" onClick={toggleTheme}>
            <RuralIcon name={theme === 'dark' ? 'sun' : 'moon'} />
            <span>{theme === 'dark' ? 'দিনের আলো' : 'রাতের আবহ'}</span>
          </button>
          <button data-no-translate="true" type="button" aria-label={targetLanguageLabel} onClick={() => setLanguagePreference(language === 'bng' ? 'eng' : 'bng')}>
            <RuralIcon name="leaf" />
            <span>{targetLanguageLabel}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
