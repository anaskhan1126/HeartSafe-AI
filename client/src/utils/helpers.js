export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const getRiskColor = (prediction) =>
  prediction === 'High Risk' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'

export const parseRecordsResponse = (data) => ({
  records: data.records ?? (Array.isArray(data) ? data : []),
  pagination: data.pagination ?? null,
})
