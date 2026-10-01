import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context'
import './styles/index.css'
import './styles/enhancements.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
