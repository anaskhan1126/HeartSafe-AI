import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileText, Download, Sparkles, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import ExportButtons from '../components/ui/ExportButtons'
import { TableSkeleton } from '../components/ui/Skeleton'
import { getRecords, summarizeReport } from '../services/reportService'
import { exportPredictions, exportReport } from '../services/exportService'

const Reports = () => {
  const { t, i18n } = useTranslation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState({})
  const [summaryLoading, setSummaryLoading] = useState({})

  useEffect(() => { fetchRecords() }, [])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const data = await getRecords({ per_page: 50 })
      setRecords(data.records || data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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

  const formatDate = (d) => new Date(d).toLocaleString()

  if (loading) return <TableSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('reports.title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('reports.subtitle')}</p>
        </div>
        <ExportButtons onExport={exportPredictions} />
      </motion.div>

      {records.length === 0 ? (
        <GlassCard className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('records.noRecords')}</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {records.map((record, i) => (
            <GlassCard key={record.id} delay={i * 0.05} className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {record.prediction === 'High Risk'
                      ? <AlertCircle className="w-6 h-6 text-red-500" />
                      : <CheckCircle className="w-6 h-6 text-green-500" />}
                    <h3 className={`text-xl font-bold ${
                      record.prediction === 'High Risk' ? 'text-red-600' : 'text-green-600'
                    }`}>{record.prediction}</h3>
                    <span className="text-sm text-gray-500">{record.probability}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    {formatDate(record.timestamp)}
                  </div>

                  {summaries[record.id] && (
                    <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{summaries[record.id]}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {['Age', 'Sex', 'RestingBP', 'Cholesterol'].map(key => (
                      <div key={key} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500">{key}</p>
                        <p className="font-semibold">{record.inputs[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleSummarize(record)}
                    disabled={summaryLoading[record.id]}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 transition-colors">
                    <Sparkles className="w-4 h-4" />
                    {summaryLoading[record.id] ? t('dashboard.generatingSummary') : t('records.summarize')}
                  </button>
                  <button onClick={() => exportReport(record.id, 'pdf')}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors">
                    <Download className="w-4 h-4" />
                    {t('records.downloadReport')}
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reports
