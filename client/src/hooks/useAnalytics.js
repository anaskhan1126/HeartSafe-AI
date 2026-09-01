import { useState, useEffect, useCallback } from 'react'
import { getFullAnalytics, getDashboardStats } from '../services/analyticsService'

export const useAnalytics = (autoFetch = true) => {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsData, fullData] = await Promise.all([
        getDashboardStats(),
        getFullAnalytics(),
      ])
      setStats(statsData)
      setAnalytics(fullData)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) fetchData()
  }, [autoFetch, fetchData])

  return { stats, analytics, loading, error, refetch: fetchData }
}
