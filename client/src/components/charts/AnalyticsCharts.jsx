import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'
import GlassCard from '../ui/GlassCard'

const COLORS = ['#dc2626', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
const RISK_COLORS = { 'High Risk': '#dc2626', 'Low Risk': '#10b981' }

const ChartWrapper = ({ title, children, delay = 0 }) => (
  <GlassCard delay={delay} className="p-4 lg:p-6">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
    <div className="h-56 lg:h-64">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </GlassCard>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900 dark:text-white">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export const DailyChart = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  return (
    <ChartWrapper title={t('analytics.daily')} delay={delay}>
      <LineChart data={data || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Total" />
      </LineChart>
    </ChartWrapper>
  )
}

export const WeeklyChart = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  return (
    <ChartWrapper title={t('analytics.weekly')} delay={delay}>
      <BarChart data={data || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Predictions" />
      </BarChart>
    </ChartWrapper>
  )
}

export const MonthlyChart = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  return (
    <ChartWrapper title={t('analytics.monthly')} delay={delay}>
      <AreaChart data={data || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Predictions" />
      </AreaChart>
    </ChartWrapper>
  )
}

export const RiskPieChart = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  const chartData = (data || []).map(d => ({
    ...d,
    label: d.name === 'High Risk' ? t('common.highRisk') : t('common.lowRisk'),
    name: d.name,
  }))
  return (
    <ChartWrapper title={t('analytics.riskDist')} delay={delay}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="label" label>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={RISK_COLORS[entry.name] || COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ChartWrapper>
  )
}

export const AgeHistogram = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  return (
    <ChartWrapper title={t('analytics.ageDist')} delay={delay}>
      <BarChart data={data || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Patients" />
      </BarChart>
    </ChartWrapper>
  )
}

export const GenderChart = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  return (
    <ChartWrapper title={t('analytics.genderDist')} delay={delay}>
      <BarChart data={data || []} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis dataKey="gender" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Count" />
      </BarChart>
    </ChartWrapper>
  )
}

export const RiskTrendChart = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  return (
    <ChartWrapper title={t('analytics.riskTrend')} delay={delay}>
      <LineChart data={data || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="highRisk" stroke="#dc2626" strokeWidth={2} name={t('common.highRisk')} />
        <Line type="monotone" dataKey="lowRisk" stroke="#10b981" strokeWidth={2} name={t('common.lowRisk')} />
      </LineChart>
    </ChartWrapper>
  )
}

export const PredictionHeatmap = ({ data, delay = 0 }) => {
  const { t } = useTranslation()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxCount = Math.max(...(data || []).map(d => d.count), 1)

  const getCount = (day, hour) => {
    const item = (data || []).find(d => d.day === day && d.hour === hour)
    return item?.count || 0
  }

  return (
    <GlassCard delay={delay} className="p-4 lg:p-6 col-span-full">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('analytics.heatmap')}</h3>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(24, 1fr)` }}>
          <div />
          {hours.map(h => (
            <div key={h} className="text-[9px] text-center text-gray-400">{h}</div>
          ))}
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">{day}</div>
              {hours.map(hour => {
                const count = getCount(day, hour)
                const intensity = count / maxCount
                return (
                  <div
                    key={`${day}-${hour}`}
                    title={`${day} ${hour}:00 - ${count} predictions`}
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: count > 0
                        ? `rgba(220, 38, 38, ${0.15 + intensity * 0.85})`
                        : 'rgba(156, 163, 175, 0.1)',
                    }}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
