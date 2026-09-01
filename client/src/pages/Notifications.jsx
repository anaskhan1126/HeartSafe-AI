import React from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import { useNotifications } from '../hooks/useNotifications'

const typeIcon = { emergency: AlertTriangle, success: CheckCircle, info: Info }

const Notifications = () => {
  const { t } = useTranslation()
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications(60000)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('enterprise.notifications')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">{t('enterprise.markAllRead')}</button>
        )}
      </div>

      {loading ? <p>{t('common.loading')}</p> : notifications.length === 0 ? (
        <GlassCard className="p-8 text-center"><Bell className="w-12 h-12 mx-auto text-gray-400 mb-2" /><p className="text-gray-500">{t('enterprise.noNotifications')}</p></GlassCard>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const Icon = typeIcon[n.type] || Info
            return (
              <GlassCard key={n.id} className={`p-4 ${!n.read ? 'border-l-4 border-primary-500' : ''}`}
                onClick={() => !n.read && markRead(n.id)}>
                <div className="flex gap-3">
                  <Icon className={`w-5 h-5 ${n.type === 'emergency' ? 'text-red-500' : 'text-primary-600'}`} />
                  <div>
                    <h3 className="font-semibold">{n.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Notifications
