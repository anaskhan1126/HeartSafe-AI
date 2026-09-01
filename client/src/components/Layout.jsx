import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import LanguageSwitcher from './ui/LanguageSwitcher'
import NotificationBell from './ui/NotificationBell'
import {
  LayoutDashboard, Activity, History, User, LogOut, Menu, X,
  Moon, Sun, BarChart3, FileText, Shield, Stethoscope,
  MessageSquare, Calendar, Pill, Users, Bell,
} from 'lucide-react'

const Layout = ({ children }) => {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role = user?.role || 'patient'

  const allNav = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard, roles: ['patient', 'doctor', 'admin'] },
    { name: t('nav.records'), href: '/records', icon: History, roles: ['patient', 'doctor', 'admin'] },
    { name: t('nav.reports'), href: '/reports', icon: FileText, roles: ['patient', 'doctor', 'admin'] },
    { name: t('nav.analytics'), href: '/analytics', icon: BarChart3, roles: ['patient', 'doctor', 'admin'] },
    { name: t('enterprise.consultations'), href: '/consultations', icon: MessageSquare, roles: ['patient', 'doctor', 'admin'] },
    { name: t('enterprise.appointments'), href: '/appointments', icon: Calendar, roles: ['patient', 'doctor', 'admin'] },
    { name: t('enterprise.medications'), href: '/medications', icon: Pill, roles: ['patient'] },
    { name: t('enterprise.familyHistory'), href: '/family-history', icon: Users, roles: ['patient'] },
    { name: t('enterprise.notifications'), href: '/notifications', icon: Bell, roles: ['patient', 'doctor', 'admin'] },
    { name: t('nav.doctor'), href: '/doctor', icon: Stethoscope, roles: ['doctor'] },
    { name: t('nav.admin'), href: '/admin', icon: Shield, roles: ['admin'] },
    { name: t('nav.profile'), href: '/profile', icon: User, roles: ['patient', 'doctor', 'admin'] },
  ]

  const navigation = allNav.filter(item => item.roles.includes(role))

  const isActive = (path) => location.pathname === path

  const roleBadge = {
    patient: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    doctor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div className="min-h-screen healthcare-bg">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 start-0 z-50 h-full w-64 sidebar-glass transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full rtl:-translate-x-0'}
        lg:translate-x-0 lg:rtl:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{t('app.name')}</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('app.tagline')}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${active
                      ? 'bg-gradient-to-r from-red-500/10 to-rose-500/10 text-primary-600 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${roleBadge[role]}`}>{role}</span>
              </div>
            </div>
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 header-glass">
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 ms-auto">
              <NotificationBell />
              <LanguageSwitcher />
              <button onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default Layout
