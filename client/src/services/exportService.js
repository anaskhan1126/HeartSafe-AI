import api from '../utils/api'

const downloadBlob = (response, defaultName) => {
  const disposition = response.headers['content-disposition']
  let filename = defaultName
  if (disposition) {
    const match = disposition.match(/filename=(.+)/)
    if (match) filename = match[1].replace(/"/g, '')
  }
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const exportPredictions = (format, params = {}) =>
  api.get('/export/predictions', {
    params: { format, ...params },
    responseType: 'blob',
  }).then(r => downloadBlob(r, `predictions.${format === 'xlsx' ? 'xlsx' : format}`))

export const exportAnalytics = (format, params = {}) =>
  api.get('/export/analytics', {
    params: { format, ...params },
    responseType: 'blob',
  }).then(r => downloadBlob(r, `analytics.${format === 'xlsx' ? 'xlsx' : format}`))

export const exportPopulation = (format) =>
  api.get('/export/population', {
    params: { format },
    responseType: 'blob',
  }).then(r => downloadBlob(r, `population.${format === 'xlsx' ? 'xlsx' : format}`))

export const exportReport = (recordId, format = 'pdf') =>
  api.get(`/export/reports/${recordId}`, {
    params: { format },
    responseType: 'blob',
  }).then(r => downloadBlob(r, `report.${format === 'xlsx' ? 'xlsx' : format}`))
