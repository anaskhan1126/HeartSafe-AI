import api from '../utils/api'

export const getUsers = (params = {}) =>
  api.get('/admin/users', { params }).then(r => r.data)

export const createUser = (data) =>
  api.post('/admin/users', data).then(r => r.data)

export const updateUser = (id, data) =>
  api.put(`/admin/users/${id}`, data).then(r => r.data)

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`).then(r => r.data)

export const getDoctors = (params = {}) =>
  api.get('/admin/doctors', { params }).then(r => r.data)

export const assignPatient = (patientId, doctorId) =>
  api.post('/admin/assign-patient', { patientId, doctorId }).then(r => r.data)
