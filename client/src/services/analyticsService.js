import api from '../utils/api'

export const getDashboardStats = (params = {}) =>
  api.get('/analytics/dashboard', { params }).then(r => r.data)

export const getFullAnalytics = (params = {}) =>
  api.get('/analytics/full', { params }).then(r => r.data)

export const getPopulationAnalytics = () =>
  api.get('/analytics/population').then(r => r.data)

export const getAdminAnalytics = () =>
  api.get('/admin/analytics').then(r => r.data)

export const getDoctorAnalytics = () =>
  api.get('/doctor/analytics').then(r => r.data)
