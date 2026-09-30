const THEME_SESSION_KEY = 'theme_mode'

function get_system_theme_mode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function has_manual_theme_mode() {
  const saved_mode = sessionStorage.getItem(THEME_SESSION_KEY)
  return saved_mode === 'light' || saved_mode === 'dark'
}

export function get_theme_mode() {
  const saved_mode = sessionStorage.getItem(THEME_SESSION_KEY)
  if (saved_mode === 'light' || saved_mode === 'dark') return saved_mode
  return get_system_theme_mode()
}

export function apply_theme_mode(mode) {
  const resolved_mode = mode === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.themeMode = resolved_mode
  document.body.dataset.themeMode = resolved_mode
  document.documentElement.style.colorScheme = resolved_mode
  return resolved_mode
}

export function set_manual_theme_mode(mode) {
  const resolved_mode = apply_theme_mode(mode)
  sessionStorage.setItem(THEME_SESSION_KEY, resolved_mode)
  return resolved_mode
}

export function subscribe_to_system_theme(callback) {
  const media_query = window.matchMedia('(prefers-color-scheme: dark)')
  const handle_change = () => {
    if (!has_manual_theme_mode()) callback(get_system_theme_mode())
  }

  if (media_query.addEventListener) {
    media_query.addEventListener('change', handle_change)
    return () => media_query.removeEventListener('change', handle_change)
  }

  media_query.addListener(handle_change)
  return () => media_query.removeListener(handle_change)
}
