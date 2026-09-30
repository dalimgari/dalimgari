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

  // Theme mode is controlled locally by the device preference/session switch.
  // Keep the database customization layer responsible for visual tokens.
  const token_map = {
    font_family: '--font-family',
    primary_color: '--color-primary',
    secondary_color: '--color-secondary',
    accent_color: '--color-accent',
    background_color: '--color-background',
    surface_color: '--color-surface',
    surface_strong_color: '--color-surface-strong',
    text_color: '--color-text',
    text_muted_color: '--color-text-muted',
    border_color: '--color-border',
    success_color: '--color-success',
    danger_color: '--color-danger',
    warning_color: '--color-warning'
  }

  Object.entries(token_map).forEach(([key, token]) => {
    if (values[key]) root.style.setProperty(token, values[key])
  })

  root.style.setProperty('--color-primary-strong', values.primary_strong_color || 'color-mix(in srgb,var(--color-primary) 78%,#000)')
  root.style.setProperty('--color-primary-soft', values.primary_soft_color || 'color-mix(in srgb,var(--color-primary) 12%,var(--color-surface-strong))')
  root.style.setProperty('--color-text-on-primary', values.text_on_primary_color || '#fff')
}

export function resolve_theme_mode(mode, prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches) {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  return prefers_dark ? 'dark' : 'light'
}
