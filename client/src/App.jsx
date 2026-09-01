import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import RoleRoute from './components/auth/RoleRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import Doctor from './pages/Doctor'
import Profile from './pages/Profile'
import Consultations from './pages/Consultations'
import Appointments from './pages/Appointments'
import Medications from './pages/Medications'
import FamilyHistory from './pages/FamilyHistory'
import Notifications from './pages/Notifications'

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center healthcare-bg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
)

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Navigate to="/dashboard" /> : children
}

const withLayout = (Component) => (
  <Layout><Component /></Layout>
)

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute>{withLayout(Dashboard)}</PrivateRoute>} />
      <Route path="/records" element={<PrivateRoute>{withLayout(Records)}</PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute>{withLayout(Reports)}</PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute>{withLayout(Analytics)}</PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute>{withLayout(Profile)}</PrivateRoute>} />
      <Route path="/consultations" element={<PrivateRoute>{withLayout(Consultations)}</PrivateRoute>} />
      <Route path="/appointments" element={<PrivateRoute>{withLayout(Appointments)}</PrivateRoute>} />
      <Route path="/medications" element={<PrivateRoute>{withLayout(Medications)}</PrivateRoute>} />
      <Route path="/family-history" element={<PrivateRoute>{withLayout(FamilyHistory)}</PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute>{withLayout(Notifications)}</PrivateRoute>} />
      <Route path="/admin" element={
        <PrivateRoute>
          <RoleRoute roles={['admin']}>{withLayout(Admin)}</RoleRoute>
        </PrivateRoute>
      } />
      <Route path="/doctor" element={
        <PrivateRoute>
          <RoleRoute roles={['doctor']}>{withLayout(Doctor)}</RoleRoute>
        </PrivateRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
