import { supabase_client } from '../../service/supabase/supabase_client.js'

export async function get_customization_settings() {
  const { data, error } = await supabase_client
    .from('customization_settings')
    .select('setting_key, setting_value, is_active')
    .eq('is_active', true)
    .order('setting_key')

  if (error) throw error
  return data ?? []
}

export function apply_theme_settings(settings = []) {
  const root = document.documentElement
  const values = Object.fromEntries(settings.map((item) => [item.setting_key, item.setting_value?.value ?? item.setting_value]))

  if (values.theme_mode) root.dataset.themeMode = values.theme_mode
  if (values.font_family) root.style.setProperty('--font-family', values.font_family)
  if (values.primary_color) root.style.setProperty('--color-primary', values.primary_color)
  if (values.secondary_color) root.style.setProperty('--color-secondary', values.secondary_color)
  if (values.background_color) root.style.setProperty('--color-background', values.background_color)
  if (values.text_color) root.style.setProperty('--color-text', values.text_color)
  if (values.surface_color) root.style.setProperty('--color-surface', values.surface_color)
  if (values.border_color) root.style.setProperty('--color-border', values.border_color)
}

export function resolve_theme_mode(mode, prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches) {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  return prefers_dark ? 'dark' : 'light'
}
