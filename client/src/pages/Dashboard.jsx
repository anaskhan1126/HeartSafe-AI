import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Activity, Clock, AlertCircle, CheckCircle, Heart, CalendarDays, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../components/ui/StatCard'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import GlassCard from '../components/ui/GlassCard'
import EmergencyAlert from '../components/ui/EmergencyAlert'
import PredictionForm from '../components/prediction/PredictionForm'
import { makePrediction, summarizeReport } from '../services/reportService'
import { getDashboardStats } from '../services/analyticsService'

const INITIAL_FORM = {
  Age: '', Sex: 'M', ChestPainType: 'ATA', RestingBP: '', Cholesterol: '',
  FastingBS: 'No', RestingECG: 'Normal', MaxHR: '', ExerciseAngina: 'No',
  Oldpeak: '', ST_Slope: 'Up',
}

const Dashboard = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [result, setResult] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState('')
  const [emergency, setEmergency] = useState(null)
  const role = user?.role || 'patient'

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setStatsLoading(true)
      const statsRes = await getDashboardStats()
      setStats(statsRes)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setSummary(null)
    setEmergency(null)
    setLoading(true)
    try {
      const response = await makePrediction(formData)
      setResult(response)
      setEmergency(response.emergency || null)
      setSummaryLoading(true)
      const summaryRes = await summarizeReport({
        recordId: response.recordId,
        language: i18n.language?.split('-')[0] || 'en',
      })
      setSummary(summaryRes.summary)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed')
    } finally {
      setLoading(false)
      setSummaryLoading(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A'

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">{t('dashboard.title')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('dashboard.welcome', { name: user?.name })}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title={t('dashboard.totalPredictions')} value={stats?.totalPredictions} icon={Activity} delay={0} />
            <StatCard title={t('dashboard.highRisk')} value={stats?.highRiskPredictions} icon={AlertCircle} color="red" delay={0.05} />
            <StatCard title={t('dashboard.lowRisk')} value={stats?.lowRiskPredictions} icon={CheckCircle} color="green" delay={0.1} />
            <StatCard title={t('dashboard.avgAge')} value={stats?.averagePatientAge} icon={Heart} color="purple" delay={0.15} />
            <StatCard title={t('dashboard.todayPredictions')} value={stats?.todayPredictions} icon={Clock} color="blue" delay={0.2} />
            <StatCard title={t('dashboard.monthPredictions')} value={stats?.monthPredictions} icon={CalendarDays} color="orange" delay={0.25} />
          </>
        )}
      </div>

      {emergency && <EmergencyAlert emergency={emergency} />}

      {role === 'admin' && (
        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{t('enterprise.adminDashboard')}</h2>
            <p className="text-sm text-gray-500">{t('enterprise.adminDashboardDesc')}</p>
          </div>
          <Link to="/admin" className="btn-primary flex items-center gap-2">{t('nav.admin')} <ArrowRight className="w-4 h-4" /></Link>
        </GlassCard>
      )}

      {role === 'doctor' && (
        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{t('enterprise.doctorDashboard')}</h2>
            <p className="text-sm text-gray-500">{t('enterprise.doctorDashboardDesc')}</p>
          </div>
          <Link to="/doctor" className="btn-primary flex items-center gap-2">{t('nav.doctor')} <ArrowRight className="w-4 h-4" /></Link>
        </GlassCard>
      )}

      {role === 'patient' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.predictTitle')}
          </h2>
          <PredictionForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        </GlassCard>

        <GlassCard className="p-6" delay={0.1}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.resultTitle')}
          </h2>
          {result ? (
            <div className="space-y-4">
              <div className={`p-6 rounded-xl text-center ${
                result.prediction === 'High Risk'
                  ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
              }`}>
                {result.prediction === 'High Risk'
                  ? <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  : <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />}
                <h3 className={`text-3xl font-bold mb-2 ${
                  result.prediction === 'High Risk' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                }`}>{result.prediction}</h3>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  {t('dashboard.probability')}: <span className="font-bold">{result.probability}%</span>
                </p>
                {result.familyHistoryImpact?.adjustment > 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    +{result.familyHistoryImpact.adjustment}% from family history
                  </p>
                )}
              </div>

              {emergency && <EmergencyAlert emergency={emergency} />}

              {(summary || summaryLoading) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-semibold text-indigo-700 dark:text-indigo-400 mb-2">{t('dashboard.aiSummary')}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {summaryLoading ? t('dashboard.generatingSummary') : summary}
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.savedNote')}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t('dashboard.submitForm')}</p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
      )}
    </div>
  )
}

export default Dashboard
