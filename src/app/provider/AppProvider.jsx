import { createContext, useContext, useMemo } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const value = useMemo(() => ({}), [])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
