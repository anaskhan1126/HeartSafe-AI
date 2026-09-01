import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />

  const userRole = user.role || 'patient'
  if (!roles.includes(userRole)) {
    return <Navigate to="/dashboard" />
  }

  return children
}

export default RoleRoute
