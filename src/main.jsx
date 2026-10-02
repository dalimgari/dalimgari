import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context'
import { PreferencesProvider } from './context/PreferencesContext'
import './styles/index.css'
import './styles/enhancements.css'
import './styles/local-cards-scroll.css'
import './styles/information.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </AuthProvider>
  </StrictMode>,
)
