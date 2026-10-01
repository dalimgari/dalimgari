import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    if (!supabase) {
      setStatus('ready')
      return undefined
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUser(data.user ?? null)
      setStatus('ready')
    }).catch(() => {
      if (!active) return
      setUser(null)
      setStatus('ready')
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      setStatus('ready')
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, status }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
