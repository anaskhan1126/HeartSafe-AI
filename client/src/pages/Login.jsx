import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import { Activity, Moon, Sun } from 'lucide-react'

const Login = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (result.success) {
      const role = result.user?.role || 'patient'
      if (role === 'admin') navigate('/admin')
      else if (role === 'doctor') navigate('/doctor')
      else navigate('/dashboard')
    } else setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center healthcare-bg py-12 px-4">
      <div className="absolute top-4 end-4 flex items-center gap-3">
        <LanguageSwitcher />
        <button onClick={toggleTheme}
          className="p-2 rounded-xl glass-card text-gray-500 hover:bg-white/80 transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold gradient-text">{t('auth.welcomeBack')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('auth.signIn')}</p>
        </div>

        <div className="glass-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="label">{t('auth.email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('auth.signingIn') : t('auth.signInBtn')}
            </button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                {t('auth.signUp')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
