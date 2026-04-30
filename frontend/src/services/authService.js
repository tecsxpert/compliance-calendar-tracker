import api from './api'

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password })

export const register = (name, email, password) =>
  api.post('/api/auth/register', { name, email, password })

export const refresh = () =>
  api.post('/api/auth/refresh')