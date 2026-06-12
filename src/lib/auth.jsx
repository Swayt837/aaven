import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api'
import { identifyUser, resetAnalytics } from './analytics'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await api.me()
      setUser(me.user)
      identifyUser(me.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Lance la connexion Google. En l'absence de config Google côté serveur,
  // l'endpoint renvoie {dev:true} et on bascule sur le dev-login.
  const login = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/google', { credentials: 'include' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url // vraie redirection OAuth
        return
      }
    } catch {
      /* tombe sur le dev login */
    }
    await api.devLogin()
    await refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
    resetAnalytics()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
