import React, { createContext, useState, useEffect } from 'react'
import {jwtDecode} from 'jwt-decode'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode(token)
        setUserId(decoded.uid)
        setRole(decoded.role)
        setUser({ name: decoded.name, email: decoded.email, role: decoded.role })
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  function loginUser(token, roleValue) {
    localStorage.setItem('token', token)
    const decoded = jwtDecode(token)
    setUserId(decoded.uid)
    setRole(roleValue)
    setUser({ name: decoded.name, email: decoded.email, role: roleValue })
    setIsAuthenticated(true)
  }

  function logoutUser() {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setRole(null)
    setUserId(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, userId, user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}
