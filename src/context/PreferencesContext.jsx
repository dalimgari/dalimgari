import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { applyTheme, getDeviceClass, getLanguagePreference, getThemePreference, resolveTheme, setLanguagePreference as saveLanguagePreference, setThemePreference, subscribeToSystemTheme } from '../services/devicePreferenceService'
import { getGlobalLabels } from '../services/globalLabelService'
import { getActiveVisualTheme, setActiveVisualTheme } from '../services/themeService'
import { applyVisualTheme } from '../services/devicePreferenceService'
import { observeLanguageDocument } from '../services/languageRuntime'
import { LANGUAGES } from '../config/preferences'

const PreferencesContext = createContext(null)
const DEFAULT_LANGUAGE = LANGUAGES.bengali

export function PreferencesProvider({ children }) {
  const [themePreference, setThemeState] = useState(() => getThemePreference())
  const [theme, setTheme] = useState(() => resolveTheme(themePreference))
  const [language, setLanguage] = useState(() => getLanguagePreference() || DEFAULT_LANGUAGE)
  const [deviceClass, setDeviceClass] = useState(() => getDeviceClass())
  const [labels, setLabels] = useState({})
  const [visualTheme, setVisualTheme] = useState('classic')

  useEffect(() => {
    const resolved = resolveTheme(themePreference)
    setTheme(resolved)
    applyTheme(resolved)
    if (themePreference !== 'system') return undefined
    return subscribeToSystemTheme((next) => { setTheme(next); applyTheme(next) })
  }, [themePreference])

  useEffect(() => {
    const onResize = () => setDeviceClass(getDeviceClass())
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('orientationchange', onResize, { passive: true })
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize) }
  }, [])

  useEffect(() => {
    let active = true
    getActiveVisualTheme().then((next) => { if (active) { setVisualTheme(next); applyVisualTheme(next) } }).catch(() => { applyVisualTheme('classic') })
    getGlobalLabels().then((next) => { if (active) setLabels(next) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    const stop = observeLanguageDocument(language)
    return stop
  }, [language])

  const changeTheme = useCallback((value) => {
    const next = setThemePreference(value)
    setThemeState(next)
    setTheme(resolveTheme(next))
    applyTheme(resolveTheme(next))
  }, [])

  const changeVisualTheme = useCallback(async (value) => {
    const next = await setActiveVisualTheme(value)
    setVisualTheme(next)
    applyVisualTheme(next)
    return next
  }, [])

  const changeLanguage = useCallback((value) => {
    const next = saveLanguagePreference(value)
    setLanguage(next)
    return next
  }, [])

  const value = useMemo(() => ({
    themePreference,
    theme,
    language,
    deviceClass,
    labels,
    visualTheme,
    setThemePreference: changeTheme,
    setVisualTheme: changeVisualTheme,
    setLanguagePreference: changeLanguage,
  }), [themePreference, theme, language, deviceClass, labels, changeTheme, changeLanguage])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider')
  return context
}