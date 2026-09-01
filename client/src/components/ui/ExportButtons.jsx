import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

const ExportButtons = ({ onExport, showDateFilter = true, className = '' }) => {
  const { t } = useTranslation()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(null)

  const handleExport = async (format) => {
    setLoading(format)
    try {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      await onExport(format, params)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setLoading(null)
    }
  }

  const btnClass = 'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50'

  return (
    <div className={`space-y-3 ${className}`}>
      {showDateFilter && (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t('export.from')}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="input-field text-sm py-1.5" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">{t('export.to')}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="input-field text-sm py-1.5" />
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleExport('csv')} disabled={!!loading}
          className={`${btnClass} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50`}>
          <Download className="w-4 h-4" />
          {loading === 'csv' ? t('common.loading') : t('export.csv')}
        </button>
        <button onClick={() => handleExport('xlsx')} disabled={!!loading}
          className={`${btnClass} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50`}>
          <FileSpreadsheet className="w-4 h-4" />
          {loading === 'xlsx' ? t('common.loading') : t('export.excel')}
        </button>
        <button onClick={() => handleExport('pdf')} disabled={!!loading}
          className={`${btnClass} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50`}>
          <FileText className="w-4 h-4" />
          {loading === 'pdf' ? t('common.loading') : t('export.pdf')}
        </button>
      </div>
    </div>
  )
}

export default ExportButtons
