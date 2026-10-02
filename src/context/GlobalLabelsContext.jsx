import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { GLOBAL_LABEL_DEFAULTS, getGlobalLabels } from '../services/globalLabelService'

const GlobalLabelsContext = createContext(null)

export function GlobalLabelsProvider({ children }) {
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
    const t = (key, fallbackBn, fallbackEn) => {
      const item = labels[key]
      const language = document.documentElement.lang === 'en' ? 'eng' : 'bng'
      if (language === 'eng') return item?.eng || fallbackEn || GLOBAL_LABEL_DEFAULTS[key] || key
      return item?.bng || fallbackBn || item?.eng || GLOBAL_LABEL_DEFAULTS[key] || key
    }
    return { labels, status, reloadLabels: load, t }
  }, [labels, status, load])

  return <GlobalLabelsContext.Provider value={value}>{children}</GlobalLabelsContext.Provider>
}

export function useGlobalLabels() {
  const value = useContext(GlobalLabelsContext)
  if (!value) throw new Error('useGlobalLabels must be used inside GlobalLabelsProvider')
  return value
}
