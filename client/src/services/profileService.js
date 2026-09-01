import api from '../utils/api'

export const updateProfile = (data) =>
  api.put('/profile', data).then(r => r.data)

export const getProfile = () =>
  api.get('/auth/me').then(r => r.data)
