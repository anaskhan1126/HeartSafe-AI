import api from '../utils/api'

export const getPatients = (params = {}) =>
  api.get('/doctor/patients', { params }).then(r => r.data)

export const getPatientRecords = (patientId, params = {}) =>
  api.get(`/doctor/patients/${patientId}/records`, { params }).then(r => r.data)
