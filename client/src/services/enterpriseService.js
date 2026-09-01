import api from '../utils/api'

export const getConsultations = (params) =>
  api.get('/consultations', { params }).then(r => r.data)

export const createConsultation = (data) =>
  api.post('/consultations', data).then(r => r.data)

export const respondConsultation = (id, response) =>
  api.put(`/consultations/${id}/respond`, { response }).then(r => r.data)

export const getAppointments = (params) =>
  api.get('/appointments', { params }).then(r => r.data)

export const createAppointment = (data) =>
  api.post('/appointments', data).then(r => r.data)

export const cancelAppointment = (id) =>
  api.put(`/appointments/${id}/cancel`).then(r => r.data)

export const getMedications = () =>
  api.get('/medications').then(r => r.data)

export const addMedication = (data) =>
  api.post('/medications', data).then(r => r.data)

export const updateMedication = (id, data) =>
  api.put(`/medications/${id}`, data).then(r => r.data)

export const deleteMedication = (id) =>
  api.delete(`/medications/${id}`).then(r => r.data)

export const getFamilyHistory = () =>
  api.get('/family-history').then(r => r.data)

export const updateFamilyHistory = (data) =>
  api.put('/family-history', data).then(r => r.data)

export const getNotifications = (params) =>
  api.get('/notifications', { params }).then(r => r.data)

export const markNotificationRead = (id) =>
  api.put(`/notifications/${id}/read`).then(r => r.data)

export const markAllNotificationsRead = () =>
  api.put('/notifications/read-all').then(r => r.data)

export const getAuditLogs = (params) =>
  api.get('/audit', { params }).then(r => r.data)

export const getDoctors = () =>
  api.get('/admin/doctors').then(r => r.data)
