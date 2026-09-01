import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Users, FileText, BarChart3, AlertCircle, CheckCircle, Download, Sparkles } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import StatCard from '../components/ui/StatCard'
import { TableSkeleton } from '../components/ui/Skeleton'
import ExportButtons from '../components/ui/ExportButtons'
import { DailyChart, RiskPieChart } from '../components/charts/AnalyticsCharts'
import { getPatients, getPatientRecords } from '../services/doctorService'
import { getDoctorAnalytics } from '../services/analyticsService'
import { exportPredictions, exportReport } from '../services/exportService'
import { summarizeReport } from '../services/reportService'
import { formatDate } from '../utils/helpers'

const Doctor = () => {
  const { t, i18n } = useTranslation()
  const [patients, setPatients] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientRecords, setPatientRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [summaries, setSummaries] = useState({})
  const [summaryLoading, setSummaryLoading] = useState({})
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [patientsRes, analyticsRes] = await Promise.all([
        getPatients({ per_page: 50 }),
        getDoctorAnalytics(),
      ])
      setPatients(patientsRes.patients || [])
      setAnalytics(analyticsRes)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load doctor dashboard')
    } finally {
      setLoading(false)
    }
  }

  const viewPatientRecords = async (patient) => {
    setSelectedPatient(patient)
    setSummaries({})
    try {
      setRecordsLoading(true)
      const data = await getPatientRecords(patient.id, { per_page: 50 })
      setPatientRecords(data.records || [])
    } catch (err) {
      setPatientRecords([])
      setError(err.response?.data?.error || 'Failed to load patient records')
    } finally {
      setRecordsLoading(false)
    }
  }

  const handleSummarize = async (record) => {
    setSummaryLoading(prev => ({ ...prev, [record.id]: true }))
    try {
      const res = await summarizeReport({
        recordId: record.id,
        language: i18n.language?.split('-')[0] || 'en',
      })
      setSummaries(prev => ({ ...prev, [record.id]: res.summary }))
    } catch (err) {
      console.error(err)
    } finally {
      setSummaryLoading(prev => ({ ...prev, [record.id]: false }))
    }
  }

  if (loading) return <TableSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('doctor.title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('doctor.subtitle')}</p>
        </div>
        <ExportButtons onExport={exportPredictions} />
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {analytics?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t('admin.patientCount')} value={analytics.patientCount} icon={Users} color="blue" />
          <StatCard title={t('dashboard.totalPredictions')} value={analytics.stats.totalPredictions} icon={BarChart3} color="purple" />
          <StatCard title={t('dashboard.highRisk')} value={analytics.stats.highRiskPredictions} icon={AlertCircle} color="red" />
          <StatCard title={t('dashboard.lowRisk')} value={analytics.stats.lowRiskPredictions} icon={CheckCircle} color="green" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold mb-4">{t('doctor.title')}</h2>
          {patients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('doctor.noPatients')}</p>
          ) : (
            <div className="space-y-3">
              {patients.map(p => (
                <div key={p.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedPatient?.id === p.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300'
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => viewPatientRecords(p)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-sm text-gray-500">{p.email}</p>
                    </div>
                    <span className="text-sm text-primary-600">
                      {p.predictionCount} {t('doctor.predictions')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {selectedPatient
              ? t('doctor.patientRecords', { name: selectedPatient.name })
              : t('doctor.viewRecords')}
          </h2>

          {recordsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : !selectedPatient ? (
            <p className="text-gray-500 text-center py-8">{t('doctor.selectPatient')}</p>
          ) : patientRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('doctor.noRecords')}</p>
          ) : (
            <div className="space-y-3 max-h-[28rem] overflow-y-auto">
              {patientRecords.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-2">
                  <div className="flex items-center gap-2">
                    {r.prediction === 'High Risk'
                      ? <AlertCircle className="w-4 h-4 text-red-500" />
                      : <CheckCircle className="w-4 h-4 text-green-500" />}
                    <span className="font-semibold">{r.prediction}</span>
                    <span className="text-sm text-gray-500">{r.probability}%</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(r.timestamp)} | {t('form.age')}: {r.inputs.Age} | {t('form.restingBP')}: {r.inputs.RestingBP}
                  </p>

                  {summaries[r.id] && (
                    <p className="text-sm p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-gray-700 dark:text-gray-300">
                      {summaries[r.id]}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => handleSummarize(r)} disabled={summaryLoading[r.id]}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg">
                      <Sparkles className="w-3 h-3" />
                      {summaryLoading[r.id] ? t('dashboard.generatingSummary') : t('records.summarize')}
                    </button>
                    <button onClick={() => exportReport(r.id, 'pdf')}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                      <Download className="w-3 h-3" />
                      {t('records.downloadReport')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {analytics?.analytics && (
        <div>
          <h2 className="text-lg font-bold mb-4">{t('doctor.patientAnalytics')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyChart data={analytics.analytics.daily} />
            <RiskPieChart data={analytics.analytics.riskDistribution} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Doctor
