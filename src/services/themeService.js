import { supabase } from '../lib/supabase'

const DEFAULT_THEME = {
  colors: {},
  states: {},
  interaction: {},
  shape: {},
  shadow: {},
  typography: {},
  scrollbar: {},
}

export async function getThemeSettings() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('theme_settings').select('settings_key,day,night,is_active,updated_at').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function updateThemeSettings(values) {
  if (!supabase) throw new Error('Supabase is not configured')
  const payload = {
    settings_key: 'global',
    day: { ...DEFAULT_THEME, ...(values.day || {}) },
    night: { ...DEFAULT_THEME, ...(values.night || {}) },
    is_active: values.is_active !== false,
  }
  const { data: current, error: currentError } = await supabase.from('theme_settings').select('theme_settings_id').eq('settings_key', 'global').maybeSingle()
  if (currentError) throw currentError
  if (!current?.theme_settings_id) {
    const { data, error } = await supabase.from('theme_settings').insert(payload).select('*').single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('theme_settings').update(payload).eq('theme_settings_id', current.theme_settings_id).select('*').single()
  if (error) throw error
  return data
}
