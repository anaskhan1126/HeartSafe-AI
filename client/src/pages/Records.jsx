import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { History, Trash2, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import ExportButtons from '../components/ui/ExportButtons'
import { TableSkeleton } from '../components/ui/Skeleton'
import { getRecords, deleteRecord } from '../services/reportService'
import { exportPredictions } from '../services/exportService'

const Records = () => {
  const { t } = useTranslation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => { fetchRecords() }, [page])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const data = await getRecords({ page, per_page: 10, sort_order: 'desc' })
      setRecords(data.records || data)
      setPagination(data.pagination)
      setError('')
    } catch (err) {
      setError('Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    await deleteRecord(id)
    fetchRecords()
  }

  const formatDate = (d) => new Date(d).toLocaleString()

  if (loading && records.length === 0) return <TableSkeleton rows={5} />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('records.title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('records.subtitle')}</p>
        </div>
        <ExportButtons onExport={exportPredictions} />
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {records.length === 0 ? (
        <GlassCard className="text-center py-12">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('records.noRecords')}</h3>
          <p className="text-gray-500">{t('records.startPredicting')}</p>
        </GlassCard>
      ) : (
        <>
          <div className="space-y-4">
            {records.map((record, i) => (
              <GlassCard key={record.id} delay={i * 0.03} className="p-5">
                <div className="flex items-start justify-between">
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
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <Calendar className="w-4 h-4" />{formatDate(record.timestamp)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      {Object.entries(record.inputs)
                        .filter(([_, v]) => v !== null && typeof v !== 'object')
                        .slice(0, 8)
                        .map(([k, v]) => (
                          <div key={k}>
                            <p className="text-xs text-gray-500">{k}</p>
                            <p className="font-semibold text-sm">{String(v)}</p>
                          </div>
                        ))}
                    </div>

                  </div>
                  <button onClick={() => handleDelete(record.id)}
                    className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary text-sm disabled:opacity-50">Previous</button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {pagination.pages}
              </span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="btn-secondary text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Records
