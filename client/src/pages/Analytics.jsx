import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAnalytics } from '../hooks/useAnalytics'
import StatCard from '../components/ui/StatCard'
import { StatCardSkeleton, ChartSkeleton } from '../components/ui/Skeleton'
import ExportButtons from '../components/ui/ExportButtons'
import { Activity, AlertCircle, CheckCircle, Heart, Clock, CalendarDays } from 'lucide-react'
import {
  DailyChart, WeeklyChart, MonthlyChart, RiskPieChart,
  AgeHistogram, GenderChart, RiskTrendChart, PredictionHeatmap,
} from '../components/charts/AnalyticsCharts'
import { exportAnalytics } from '../services/exportService'

const Analytics = () => {
  const { t } = useTranslation()
  const { stats, analytics, loading } = useAnalytics()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('analytics.title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('analytics.subtitle')}</p>
        </div>
        <ExportButtons onExport={exportAnalytics} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title={t('dashboard.totalPredictions')} value={stats?.totalPredictions} icon={Activity} />
        <StatCard title={t('dashboard.highRisk')} value={stats?.highRiskPredictions} icon={AlertCircle} color="red" />
        <StatCard title={t('dashboard.lowRisk')} value={stats?.lowRiskPredictions} icon={CheckCircle} color="green" />
        <StatCard title={t('dashboard.avgAge')} value={stats?.averagePatientAge} icon={Heart} color="purple" />
        <StatCard title={t('dashboard.todayPredictions')} value={stats?.todayPredictions} icon={Clock} color="blue" />
        <StatCard title={t('dashboard.monthPredictions')} value={stats?.monthPredictions} icon={CalendarDays} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyChart data={analytics?.daily} delay={0} />
        <WeeklyChart data={analytics?.weekly} delay={0.05} />
        <MonthlyChart data={analytics?.monthly} delay={0.1} />
        <RiskPieChart data={analytics?.riskDistribution} delay={0.15} />
        <AgeHistogram data={analytics?.ageDistribution} delay={0.2} />
        <GenderChart data={analytics?.genderDistribution} delay={0.25} />
        <RiskTrendChart data={analytics?.riskTrend} delay={0.3} />
      </div>

      <PredictionHeatmap data={analytics?.heatmap} delay={0.35} />
    </div>
  )
}

export default Analytics
