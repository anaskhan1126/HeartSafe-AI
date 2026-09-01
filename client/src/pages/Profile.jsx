import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import GlassCard from '../components/ui/GlassCard'
import { User, Mail, Calendar, Activity, Save, Shield } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ur', label: 'اردو' },
  { code: 'ar', label: 'العربية' },
]

const Profile = () => {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', language: 'en',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        language: user.language || i18n.language?.split('-')[0] || 'en',
      })
    }
  }, [user, i18n.language])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (formData.password && formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        language: formData.language,
      }
      if (formData.password) updateData.password = formData.password

      const response = await api.put('/profile', updateData)
      updateUser(response.data)
      i18n.changeLanguage(formData.language)
      localStorage.setItem('language', formData.language)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setFormData({ ...formData, password: '', confirmPassword: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  const roleBadge = {
    patient: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    doctor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">{t('profile.title')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('profile.subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${roleBadge[user?.role || 'patient']}`}>
              {user?.role || 'patient'}
            </span>
          </div>

          <div className="mt-6 space-y-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500">{t('profile.totalPredictions')}</p>
                <p className="font-semibold">{user?.predictionCount ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500">{t('profile.memberSince')}</p>
                <p className="font-semibold">{formatDate(user?.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500">{t('admin.role')}</p>
                <p className="font-semibold capitalize">{user?.role || 'patient'}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2" delay={0.1}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('profile.editProfile')}</h2>

          {message.text && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-700'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label"><User className="w-4 h-4 inline me-2" />{t('auth.fullName')}</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" required />
            </div>

            <div>
              <label className="label"><Mail className="w-4 h-4 inline me-2" />{t('auth.email')}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
            </div>

            <div>
              <label className="label">{t('reports.language')}</label>
              <select name="language" value={formData.language} onChange={handleChange} className="input-field">
                {LANGUAGES.map(({ code, label }) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4">{t('profile.changePassword')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">{t('auth.password')}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">{t('auth.confirmPassword')}</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className="input-field" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
              <Save className="w-4 h-4 inline me-2" />
              {loading ? t('common.loading') : t('profile.saveChanges')}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}

export default Profile
