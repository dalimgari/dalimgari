import { supabase } from '../lib/supabase'

const DEFAULT_THEME = {
  wallpaper: '',
  icons: {},
  colors: {},
  states: {},
  interaction: {},
  shape: {},
  shadow: {},
  typography: {},
  scrollbar: {},
}

const VISUAL_THEMES = new Set(['classic', 'glass'])

function normalizeVisualTheme(value) {
  return VISUAL_THEMES.has(value) ? value : 'classic'
}

export async function getThemeSettings() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('theme_settings').select('theme_settings_id,settings_key,day,night,is_active,active_visual_theme,updated_at').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function getActiveVisualTheme() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('theme_settings').select('active_visual_theme').eq('settings_key', 'global').eq('is_active', true).maybeSingle()
  if (error) throw error
  return normalizeVisualTheme(data?.active_visual_theme)
}

export async function setActiveVisualTheme(value) {
  if (!supabase) throw new Error('Supabase is not configured')
  const activeVisualTheme = normalizeVisualTheme(value)
  const { data, error } = await supabase.from('theme_settings').update({ active_visual_theme: activeVisualTheme, is_active: true }).eq('settings_key', 'global').select('theme_settings_id,active_visual_theme,is_active,updated_at').single()
  if (error) throw error
  return normalizeVisualTheme(data.active_visual_theme)
}

export async function updateThemeSettings(values) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: current, error: currentError } = await supabase.from('theme_settings').select('theme_settings_id,active_visual_theme').eq('settings_key', 'global').maybeSingle()
  if (currentError) throw currentError

  const payload = {
    settings_key: 'global',
    day: { ...DEFAULT_THEME, ...(values.day || {}) },
    night: { ...DEFAULT_THEME, ...(values.night || {}) },
    active_visual_theme: normalizeVisualTheme(values.active_visual_theme ?? current?.active_visual_theme),
    is_active: values.is_active !== false,
  }

  if (!current?.theme_settings_id) {
    const { data, error } = await supabase.from('theme_settings').insert(payload).select('*').single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('theme_settings').update(payload).eq('theme_settings_id', current.theme_settings_id).select('*').single()
  if (error) throw error
  return data
}