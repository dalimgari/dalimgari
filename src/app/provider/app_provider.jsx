import { createContext, createElement, useContext, useMemo } from 'react'

const app_context = createContext(null)

export function app_provider({ children }) {
  const value = useMemo(() => ({}), [])

  return createElement(app_context.Provider, { value }, children)
}

export function use_app_context() {
  return useContext(app_context)
}
