import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import i18n from '../i18n'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(sessionStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const syncLanguage = (lang) => {
    if (lang && lang !== i18n.language?.split('-')[0]) {
      i18n.changeLanguage(lang)
      localStorage.setItem('language', lang)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
      syncLanguage(response.data.language)
    } catch {
      sessionStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      sessionStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      syncLanguage(userData.language)
      return { success: true, user: userData }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password })
      const { token: newToken, user: userData } = response.data
      sessionStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      syncLanguage(userData.language)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }


  const updateUser = (userData) => setUser(userData)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
