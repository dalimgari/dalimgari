import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { applyTheme, getDeviceClass, getThemePreference, resolveTheme, setThemePreference, subscribeToSystemTheme } from '../services/devicePreferenceService'
import { getGlobalLabels } from '../services/globalLabelService'

const PreferencesContext = createContext(null)
const SINGLE_LANGUAGE = 'bng'

export function PreferencesProvider({ children }) {
  const [themePreference, setThemeState] = useState(() => getThemePreference())
  const [theme, setTheme] = useState(() => resolveTheme(themePreference))
  const [language] = useState(SINGLE_LANGUAGE)
  const [deviceClass, setDeviceClass] = useState(() => getDeviceClass())
  const [labels, setLabels] = useState({})

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
    getGlobalLabels().then((next) => { if (active) setLabels(next) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    document.documentElement.lang = 'bn'
  }, [])

  const changeTheme = useCallback((value) => {
    const next = setThemePreference(value)
    setThemeState(next)
    setTheme(resolveTheme(next))
    applyTheme(resolveTheme(next))
  }, [])

  const value = useMemo(() => ({
    themePreference,
    theme,
    language,
    deviceClass,
    labels,
    setThemePreference: changeTheme,
    setLanguagePreference: () => SINGLE_LANGUAGE,
  }), [themePreference, theme, language, deviceClass, labels, changeTheme])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider')
  return context
}
