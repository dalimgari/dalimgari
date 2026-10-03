import { supabase } from '../lib/supabase'
import { getSavedVisualTheme, setSavedVisualTheme } from './devicePreferenceService'

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
  effects: {},
  components: {},
  background: {},
  spacing: {},
}

const VISUAL_THEMES = new Set(['classic', 'glass', 'village'])
const THEME_FALLBACK_ORDER = ['classic', 'glass', 'village']

function normalizeVisualTheme(value) {
  return VISUAL_THEMES.has(value) ? value : 'classic'
}

function isMissingThemeValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
}

function mergeThemeLayers(base, layer) {
  if (!layer || typeof layer !== 'object' || Array.isArray(layer)) return base
  const result = { ...(base || {}) }
  Object.entries(layer).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = mergeThemeLayers(result[key], value)
    } else if (!isMissingThemeValue(value)) {
      result[key] = value
    }
  })
  return result
}

function themeLayers(row, mode) {
  if (!row) return []
  const custom = row[mode === 'night' ? 'custom_night' : 'custom_day']
  const defaultConfig = row[mode === 'night' ? 'default_night' : 'default_day']
  const legacy = row[mode]
  return [custom, defaultConfig, legacy].filter((value) => value && typeof value === 'object')
}

export function resolveThemeFromPresets(themeKey, mode = 'day', rows = []) {
  const selected = normalizeVisualTheme(themeKey)
  const ordered = [selected, ...THEME_FALLBACK_ORDER.filter((key) => key !== selected)]
  return ordered.reduce((resolved, key) => {
    const row = rows.find((item) => item?.theme_key === key)
    return themeLayers(row, mode).reduce((result, layer) => mergeThemeLayers(result, layer), resolved)
  }, {})
}


function resolveThemeRow(row) {
  if (!row) return row
  return { ...row, day: row.custom_day || row.default_day || row.day || {}, night: row.custom_night || row.default_night || row.night || {} }
}

export async function getThemePresets() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('theme_settings')
    .select('theme_settings_id,settings_key,theme_key,day,night,default_day,default_night,custom_day,custom_night,is_active,active_visual_theme,updated_at')
    .not('theme_key', 'is', null)
    .order('theme_key', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getThemeSettings(themeKey = null) {
  if (!supabase) throw new Error('Supabase is not configured')
  const query = supabase
    .from('theme_settings')
    .select('theme_settings_id,settings_key,theme_key,day,night,default_day,default_night,custom_day,custom_night,is_active,active_visual_theme,updated_at')

  const { data, error } = themeKey
    ? await query.eq('theme_key', normalizeVisualTheme(themeKey)).maybeSingle()
    : await query.eq('is_active', true).maybeSingle()

  if (error) throw error
  if (!data) return data
  const rows = await getThemePresets()
  return { ...data, day: resolveThemeFromPresets(data.theme_key, 'day', rows), night: resolveThemeFromPresets(data.theme_key, 'night', rows) }
}

export async function getActiveVisualTheme() {
  const active = await getThemeSettings()
  const next = normalizeVisualTheme(active?.theme_key || active?.active_visual_theme)
  setSavedVisualTheme(next)
  return next
}

export function getInitialVisualTheme() {
  return getSavedVisualTheme() || 'classic'
}

export async function setActiveVisualTheme(value) {
  if (!supabase) throw new Error('Supabase is not configured')
  const themeKey = normalizeVisualTheme(value)
  const { data, error } = await supabase.rpc('save_theme_preset', {
    p_theme_key: themeKey,
    p_day: null,
    p_night: null,
  })
  if (error) throw error
  const next = normalizeVisualTheme(data?.theme_key || data?.active_visual_theme || themeKey)
  setSavedVisualTheme(next)
  return next
}

export async function resetThemeSettings(themeKey) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('reset_theme_preset', { p_theme_key: normalizeVisualTheme(themeKey) })
  if (error) throw error
  return resolveThemeRow(data)
}

export async function updateThemeSettings(values) {
  if (!supabase) throw new Error('Supabase is not configured')
  const themeKey = normalizeVisualTheme(values?.themeKey || values?.active_visual_theme)
  if (!values?.day || !values?.night) throw new Error('Theme day/night settings are required')

  const payload = {
    p_theme_key: themeKey,
    p_day: { ...DEFAULT_THEME, ...(values.day || {}) },
    p_night: { ...DEFAULT_THEME, ...(values.night || {}) },
  }

  const { data, error } = await supabase.rpc('save_theme_preset', payload)
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
  if (colors.primary) {
    setRootVariable('--theme-leaf', colors.primary)
    setRootVariable('--color-leaf', colors.primary)
  }
  if (colors.secondary) {
    setRootVariable('--theme-earth', colors.secondary)
    setRootVariable('--color-earth', colors.secondary)
  }
  if (colors.accent) {
    setRootVariable('--theme-sun', colors.accent)
    setRootVariable('--color-sun', colors.accent)
  }

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
