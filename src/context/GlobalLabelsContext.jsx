import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { GLOBAL_LABEL_DEFAULTS, getGlobalLabels } from '../services/globalLabelService'
import { UI_SSOT, flattenUiSsot } from '../config/uiSSOT'

const GlobalLabelsContext = createContext(null)
const MISSING_LABEL = 'লেবেল মিসিং'

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
    const ssotLabels = flattenUiSsot(UI_SSOT)
    const t = (key, fallbackBn) => {
      const item = labels[key] || ssotLabels[key]
      return item?.bng || fallbackBn || GLOBAL_LABEL_DEFAULTS[key] || MISSING_LABEL
    }
    const getLabel = (section, key, fallbackBn) => {
      const sectionValue = UI_SSOT?.[section]
      const item = sectionValue?.[key] || sectionValue?.canonicalTerms?.[key]
      return item?.bng || fallbackBn || MISSING_LABEL
    }
    return { labels, ssot: UI_SSOT, status, reloadLabels: load, t, getLabel }
  }, [labels, status, load])

  return <GlobalLabelsContext.Provider value={value}>{children}</GlobalLabelsContext.Provider>
}

export function useGlobalLabels() {
  const value = useContext(GlobalLabelsContext)
  if (!value) throw new Error('useGlobalLabels must be used inside GlobalLabelsProvider')
  return value
}
