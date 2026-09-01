import React from 'react'
import { AlertTriangle, Phone } from 'lucide-react'
import GlassCard from './GlassCard'

const EmergencyAlert = ({ emergency }) => {
  if (!emergency) return null

  return (
    <GlassCard className="p-5 border-2 border-red-500 bg-red-50/80 dark:bg-red-900/20 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">{emergency.title}</h3>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">{emergency.message}</p>
          {emergency.steps && (
            <ul className="mt-3 space-y-1">
              {emergency.steps.map((step, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-red-500 font-bold">{i + 1}.</span> {step}
                </li>
              ))}
            </ul>
          )}
          <a href="tel:911" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            <Phone className="w-4 h-4" /> Call Emergency (911)
          </a>
        </div>
      </div>
    </GlassCard>
  )
}

export default EmergencyAlert
