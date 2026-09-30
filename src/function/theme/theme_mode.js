export function get_theme_mode() {
  const saved_mode = localStorage.getItem('theme_mode')
  if (saved_mode === 'light' || saved_mode === 'dark') return saved_mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function apply_theme_mode(mode) {
  document.body.dataset.themeMode = mode
  localStorage.setItem('theme_mode', mode)
}
