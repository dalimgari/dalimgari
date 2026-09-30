import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { app_provider } from './app/provider/app_provider'
import { app_router } from './app/router/app_router'
import './style/global/global.css'

createRoot(document.getElementById('root')).render(
  React.createElement(
    BrowserRouter,
    null,
    React.createElement(
      app_provider,
      null,
      React.createElement(app_router)
    )
  )
)
