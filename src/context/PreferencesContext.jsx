import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { applyTheme, getDeviceClass, getLanguagePreference, getThemePreference, resolveTheme, setLanguagePreference, setThemePreference, subscribeToSystemTheme } from '../services/devicePreferenceService'
import { enableBengaliNumerals } from '../services/bengaliLanguageService'

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [themePreference, setThemeState] = useState(() => getThemePreference())
  const [theme, setTheme] = useState(() => resolveTheme(themePreference))
  const [language, setLanguageState] = useState(() => getLanguagePreference())
  const [deviceClass, setDeviceClass] = useState(() => getDeviceClass())

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
    document.documentElement.lang = language === 'bng' ? 'bn' : 'en'
    enableBengaliNumerals(language === 'bng')
  }, [language])

  const changeTheme = useCallback((value) => {
    const next = setThemePreference(value)
    setThemeState(next)
    setTheme(resolveTheme(next))
    applyTheme(resolveTheme(next))
  }, [])

  const changeLanguage = useCallback((value) => {
    const next = setLanguagePreference(value)
    setLanguageState(next)
    document.documentElement.lang = next === 'bng' ? 'bn' : 'en'
  }, [])

  const value = useMemo(() => ({ themePreference, theme, language, deviceClass, setThemePreference: changeTheme, setLanguagePreference: changeLanguage }), [themePreference, theme, language, deviceClass, changeTheme, changeLanguage])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider')
  return context
}