import React from 'react'

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />
)

export const StatCardSkeleton = () => (
  <div className="glass-card p-5">
    <div className="flex items-center justify-between">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="w-12 h-12 rounded-xl" />
    </div>
  </div>
)

export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`glass-card p-6 ${height}`}>
    <Skeleton className="h-5 w-40 mb-4" />
    <Skeleton className="h-full w-full" />
  </div>
)

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="glass-card p-6 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
)
