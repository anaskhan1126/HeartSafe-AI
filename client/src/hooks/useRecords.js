import { useState, useEffect, useCallback } from 'react'
import { getRecords, deleteRecord } from '../services/reportService'
import { parseRecordsResponse } from '../utils/helpers'

export const useRecords = (initialParams = {}) => {
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [params, setParams] = useState({ page: 1, per_page: 10, sort_order: 'desc', ...initialParams })

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getRecords(params)
      const parsed = parseRecordsResponse(data)
      setRecords(parsed.records)
      setPagination(parsed.pagination)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const remove = async (id) => {
    await deleteRecord(id)
    await fetchRecords()
  }

  return { records, pagination, loading, error, params, setParams, refetch: fetchRecords, remove }
}
