import { createContext, useState, useContext, useEffect } from 'react'
import { useRouter } from '../hooks/useRouter'
import { login as apiLogin, logout as apiLogout, register as apiRegister, getMe } from '../api/auth.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { navigateTo } = useRouter()

  // Restore session on mount
  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const isLoggedIn = user !== null

  async function logIn(email, password) {
    const userData = await apiLogin(email, password)
    setUser(userData)
    navigateTo('/')
  }

  async function register(email, firstName, lastName, displayName, password) {
    const userData = await apiRegister(email, firstName, lastName, displayName, password)
    setUser(userData)
    navigateTo('/')
  }

  async function handleLogout() {
    await apiLogout()
    setUser(null)
    navigateTo('/')
  }

  function handleLogin() {
    navigateTo('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, logIn, register, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
