import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { GLOBAL_LABEL_DEFAULTS, getGlobalLabels } from '../services/globalLabelService'
import { UI_SSOT, flattenUiSsot } from '../config/uiSSOT'
import { usePreferences } from './PreferencesContext'

const GlobalLabelsContext = createContext(null)

export function GlobalLabelsProvider({ children }) {
  const { language } = usePreferences()
  const [labels, setLabels] = useState({})
  const [status, setStatus] = useState('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const next = await getGlobalLabels()
      setLabels(next)
      setStatus('ready')
      return next
    } catch {
      setStatus('error')
      return {}
    }
  }, [])

  useEffect(() => { load() }, [load])

  const value = useMemo(() => {
    const ssotLabels = flattenUiSsot(UI_SSOT)
    const t = (key, fallbackBn, fallbackEn) => {
      const item = labels[key] || ssotLabels[key]
      if (language === 'eng') return item?.eng || fallbackEn || GLOBAL_LABEL_DEFAULTS[key] || key
      return item?.bng || fallbackBn || item?.eng || GLOBAL_LABEL_DEFAULTS[key] || key
    }
    const getLabel = (section, key, fallbackBn, fallbackEn) => {
      const sectionValue = UI_SSOT?.[section]
      const item = sectionValue?.[key] || sectionValue?.canonicalTerms?.[key]
      return language === 'eng'
        ? item?.eng || fallbackEn || key
        : item?.bng || fallbackBn || item?.eng || key
    }
    return { labels, ssot: UI_SSOT, status, reloadLabels: load, t, getLabel }
  }, [labels, status, load, language])

  return <GlobalLabelsContext.Provider value={value}>{children}</GlobalLabelsContext.Provider>
}

export function useGlobalLabels() {
  const value = useContext(GlobalLabelsContext)
  if (!value) throw new Error('useGlobalLabels must be used inside GlobalLabelsProvider')
  return value
}
