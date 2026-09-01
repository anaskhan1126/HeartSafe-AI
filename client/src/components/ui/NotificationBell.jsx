import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

const typeIcon = {
  emergency: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

const NotificationBell = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 mt-2 w-80 max-h-96 overflow-y-auto glass-card z-50 shadow-xl">
            <div className="flex items-center justify-between p-3 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
            ) : (
              notifications.map(n => {
                const Icon = typeIcon[n.type] || Info
                return (
                  <div key={n.id}
                    className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${!n.read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                    onClick={() => { markRead(n.id); if (n.link) setOpen(false) }}>
                    <div className="flex gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.type === 'emergency' ? 'text-red-500' : 'text-primary-600'}`} />
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        {n.link && (
                          <Link to={n.link} className="text-xs text-primary-600 mt-1 inline-block" onClick={() => setOpen(false)}>View</Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <Link to="/notifications" onClick={() => setOpen(false)}
              className="block p-3 text-center text-xs text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
