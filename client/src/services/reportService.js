import api from '../utils/api'

export const summarizeReport = (data) =>
  api.post('/reports/summarize', data).then(r => r.data)

export const getRecords = (params = {}) =>
  api.get('/records', { params }).then(r => r.data)

export const deleteRecord = (id) =>
  api.delete(`/records/${id}`).then(r => r.data)

export const makePrediction = (formData) =>
  api.post('/predict', formData).then(r => r.data)
