import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context'
import './styles/index.css'
import './styles/enhancements.css'
import { applyTheme, getLanguagePreference, getThemePreference, resolveTheme, subscribeToSystemTheme } from './services/devicePreferenceService'

function PreferencesProvider({ children }) {
  const [themePreference] = useState(() => getThemePreference())
  useEffect(() => {
    applyTheme(resolveTheme(themePreference))
    if (themePreference !== 'system') return undefined
    return subscribeToSystemTheme((theme) => applyTheme(theme))
  }, [themePreference])
  useEffect(() => {
    document.documentElement.lang = getLanguagePreference() === 'bng' ? 'bn' : 'en'
  }, [])
  return children
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </AuthProvider>
  </StrictMode>,
)
