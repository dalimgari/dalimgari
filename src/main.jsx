import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider, GlobalLabelsProvider } from './context'
import { PreferencesProvider } from './context/PreferencesContext'
import './styles/index.css'
import './styles/enhancements.css'
import './styles/glass-theme.css'
import './styles/local-cards-scroll.css'
import './styles/information.css'
import { initHorizontalAutoScroll } from './lib/horizontalAutoScroll.js'

initHorizontalAutoScroll()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PreferencesProvider>
        <GlobalLabelsProvider>
          <App />
        </GlobalLabelsProvider>
      </PreferencesProvider>
    </AuthProvider>
  </StrictMode>,
)
