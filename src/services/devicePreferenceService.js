import { DEVICE_BREAKPOINTS, DEVICE_PREFERENCE_KEYS, LANGUAGES, THEMES } from '../config/preferences'

const KEYS = DEVICE_PREFERENCE_KEYS

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
  return saved === THEMES.light || saved === THEMES.dark || saved === THEMES.system ? saved : THEMES.system
}

export function setThemePreference(value) {
  const next = value === THEMES.light || value === THEMES.dark || value === THEMES.system ? value : 'system'
  write(KEYS.theme, next)
  return next
}

export function resolveTheme(preference = getThemePreference()) {
  return preference === THEMES.system ? detectDeviceTheme() : preference
}

export function getLanguagePreference() {
  const saved = read(KEYS.language)
  return saved === LANGUAGES.english || saved === LANGUAGES.bengali ? saved : LANGUAGES.bengali
}

export function setLanguagePreference(value) {
  const next = value === LANGUAGES.english ? LANGUAGES.english : LANGUAGES.bengali
  write(KEYS.language, next)
  return next
}

export function getDeviceClass() {
  const width = window.innerWidth
  if (width < DEVICE_BREAKPOINTS.mobileBreakpoint) return 'mobile'
  if (width < DEVICE_BREAKPOINTS.tabletBreakpoint) return 'tablet'
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