import { useState, useEffect, useCallback } from 'react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/enterpriseService'

export const useNotifications = (pollMs = 30000) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications({ per_page: 20 })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, pollMs)
    return () => clearInterval(id)
  }, [fetchNotifications, pollMs])

  const markRead = async (nid) => {
    await markNotificationRead(nid)
    await fetchNotifications()
  }

  const markAllRead = async () => {
    await markAllNotificationsRead()
    await fetchNotifications()
  }

  return { notifications, unreadCount, loading, refetch: fetchNotifications, markRead, markAllRead }
}
