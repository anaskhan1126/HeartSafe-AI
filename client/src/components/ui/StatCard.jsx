import React from 'react'
import GlassCard from './GlassCard'

const StatCard = ({ title, value, icon: Icon, color = 'primary', delay = 0, subtitle }) => {
  const colors = {
    primary: 'from-red-500 to-rose-600',
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    orange: 'from-amber-500 to-orange-600',
    purple: 'from-violet-500 to-purple-600',
    red: 'from-red-600 to-rose-700',
  }

  return (
    <GlassCard delay={delay} className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg flex-shrink-0 ml-3`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </GlassCard>
  )
}

export default StatCard
