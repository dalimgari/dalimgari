import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { applyTheme, getDeviceClass, getLanguagePreference, getThemePreference, resolveTheme, setLanguagePreference, setThemePreference, subscribeToSystemTheme } from '../services/devicePreferenceService'
import { enableBengaliNumerals } from '../services/bengaliLanguageService'
import { getGlobalLabels } from '../services/globalLabelService'
import { observeLanguageDocument } from '../services/languageRuntime'

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [themePreference, setThemeState] = useState(() => getThemePreference())
  const [theme, setTheme] = useState(() => resolveTheme(themePreference))
  const [language, setLanguageState] = useState(() => getLanguagePreference())
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
    document.documentElement.lang = language === 'bng' ? 'bn' : 'en'
    const stop = observeLanguageDocument(language, labels)
    if (language !== 'bng') return stop
    const stopNumerals = enableBengaliNumerals()
    return () => { stop(); stopNumerals?.() }
  }, [language, labels])

  const changeTheme = useCallback((value) => {
    const next = setThemePreference(value)
    setThemeState(next)
    setTheme(resolveTheme(next))
    applyTheme(resolveTheme(next))
  }, [])

  const changeLanguage = useCallback((value) => {
    const next = setLanguagePreference(value)
    setLanguageState(next)
  }, [])

  const value = useMemo(() => ({ themePreference, theme, language, deviceClass, labels, setThemePreference: changeTheme, setLanguagePreference: changeLanguage }), [themePreference, theme, language, deviceClass, labels, changeTheme, changeLanguage])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider')
  return context
}
