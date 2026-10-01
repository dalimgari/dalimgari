const KEYS = { theme: 'dalimgari_theme_preference', language: 'dalimgari_language_preference' }

function read(key) {
  try { return window.localStorage.getItem(key) } catch { return null }
}
function write(key, value) {
  try { window.localStorage.setItem(key, value) } catch {}
}

export function detectDeviceTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getThemePreference() {
  const saved = read(KEYS.theme)
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

export function setThemePreference(value) {
  const next = value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
  write(KEYS.theme, next)
  return next
}

export function resolveTheme(preference = getThemePreference()) {
  return preference === 'system' ? detectDeviceTheme() : preference
}

export function getLanguagePreference() {
  const saved = read(KEYS.language)
  if (saved === 'bng' || saved === 'eng') return saved
  const browser = String(navigator.language || '').toLowerCase()
  return browser.startsWith('bn') ? 'bng' : 'eng'
}

export function setLanguagePreference(value) {
  const next = value === 'eng' ? 'eng' : 'bng'
  write(KEYS.language, next)
  return next
}

export function getDeviceClass() {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function subscribeToSystemTheme(callback) {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!media) return () => {}
  const handler = () => callback(media.matches ? 'dark' : 'light')
  media.addEventListener?.('change', handler)
  return () => media.removeEventListener?.('change', handler)
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
