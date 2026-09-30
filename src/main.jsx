import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './app/provider/app_provider'
import { app_router } from './app/router/app_router'
import './style/global/global.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        {React.createElement(app_router)}
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
)
