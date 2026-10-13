import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { TOKEN_KEY } from '../api/axios'

const USER_KEY = 'we_user'
const AuthContext = createContext(null)

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

// The ONLY place that knows the backend's response shape.
function normalize(data) {
  const { token, user, ...rest } = data
  return { token, user: user ?? rest }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)

  const persist = useCallback((data) => {
    const { token, user: u } = normalize(data)
    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    } catch {
      /* ignore */
    }
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    setUser(null)
  }, [])

  const login = useCallback(
    async (email, password) => persist((await api.post('/auth/login', { email, password })).data),
    [persist]
  )

  // Register does NOT log in. It sends a code; the user must verify first.
  const register = useCallback(
    async (name, email, password) =>
      (await api.post('/auth/register', { name, email, password })).data,
    []
  )

  const verifyEmail = useCallback(
    async (email, code) => persist((await api.post('/auth/verify-email', { email, code })).data),
    [persist]
  )

  const resendCode = useCallback(
    async (email) => (await api.post('/auth/resend-code', { email })).data,
    []
  )

  const loginWithGoogle = useCallback(
    async (credential) => persist((await api.post('/auth/google', { credential })).data),
    [persist]
  )

  // On app start, quietly verify the stored token. Only a 401 logs the user out.
  useEffect(() => {
    let token = null
    try {
      token = localStorage.getItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
    if (!token) return

    api
      .get('/auth/me')
      .then((res) => {
        const u = res.data?.user ?? res.data
        if (u?.email) {
          setUser(u)
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(u))
          } catch {
            /* ignore */
          }
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) logout()
      })
  }, [logout])

  const value = useMemo(
    () => ({ user, login, register, verifyEmail, resendCode, loginWithGoogle, logout }),
    [user, login, register, verifyEmail, resendCode, loginWithGoogle, logout]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}