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

function setRootVariable(name, value) {
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    document.documentElement.style.setProperty(name, String(value).trim())
  }
}

export function applyThemeSettings(theme, mode = 'day') {
  const root = document.documentElement
  const source = theme?.[mode] || theme || {}
  const colors = source.colors || {}
  const typography = source.typography || {}
  const shape = source.shape || {}
  const shadow = source.shadow || {}
  const effects = source.effects || {}
  const background = source.background || {}
  const icons = source.icons || {}
  const spacing = source.spacing || {}
  const states = source.states || {}

  const colorMap = {
    primary: '--theme-primary', secondary: '--theme-secondary', accent: '--theme-accent',
    text: '--theme-text', heading: '--theme-earthDark', muted: '--theme-muted',
    background: '--theme-page', surface: '--theme-surface', surfaceSoft: '--theme-surfaceSoft',
    border: '--theme-border', focus: '--theme-focus', hover: '--theme-hover',
  }
  Object.entries(colorMap).forEach(([key, variable]) => setRootVariable(variable, colors[key]))
  if (colors.primary) setRootVariable('--theme-leaf', colors.primary)
  if (colors.primary) setRootVariable('--color-leaf', colors.primary)
  if (colors.secondary) setRootVariable('--theme-earth', colors.secondary)
  if (colors.secondary) setRootVariable('--color-earth', colors.secondary)
  if (colors.accent) setRootVariable('--theme-sun', colors.accent)
  if (colors.accent) setRootVariable('--color-sun', colors.accent)

  Object.entries(states).forEach(([key, value]) => setRootVariable(`--color-${key}`, value))
  setRootVariable('--rural-heading-font', typography.headingFont)
  setRootVariable('--rural-body-font', typography.bodyFont)
  setRootVariable('--theme-heading-size', typography.headingSize)
  setRootVariable('--theme-body-size', typography.bodySize)
  setRootVariable('--rural-heading-weight', typography.headingWeight)
  setRootVariable('--theme-body-weight', typography.bodyWeight)
  setRootVariable('--theme-line-height', typography.lineHeight)
  setRootVariable('--theme-letter-spacing', typography.letterSpacing)

  setRootVariable('--theme-radius', shape.radius)
  setRootVariable('--theme-buttonRadius', shape.buttonRadius)
  setRootVariable('--theme-border-width', shape.borderWidth)
  setRootVariable('--theme-shadowCard', shadow.card)
  setRootVariable('--theme-shadow', shadow.strength || shadow.card)
  setRootVariable('--theme-shadowDropdown', shadow.dropdown)
  setRootVariable('--theme-shadowModal', shadow.modal)

  setRootVariable('--theme-glass-transparency', effects.transparency)
  setRootVariable('--glass-blur', effects.blur)
  setRootVariable('--glass-drop-opacity', effects.waterDropOpacity)
  setRootVariable('--theme-transition', effects.transition)
  setRootVariable('--theme-spacing-density', spacing.density)

  setRootVariable('--theme-icon-color', icons.color)
  setRootVariable('--theme-icon-size', icons.size)
  setRootVariable('--theme-icon-stroke-width', icons.strokeWidth)
  setRootVariable('--theme-icon-opacity', icons.opacity)

  if (background.wallpaper) {
    root.style.setProperty('--rural-wallpaper', `url("${background.wallpaper}")`)
  }
  setRootVariable('--rural-wallpaper-position', background.position)
  setRootVariable('--rural-wallpaper-size', background.size)
  setRootVariable('--theme-background-overlay', background.overlay)

  root.dataset.themeMode = mode
}
