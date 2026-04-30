import api from './api'

// ── Compliance Records ──────────────────────────────────────────

// GET all records with pagination, sorting, filtering
export const getAll = (params = {}) =>
  api.get('/api/compliance', { params })

// GET one record by ID
export const getById = (id) =>
  api.get(`/api/compliance/${id}`)

// POST create a new record
export const create = (data) =>
  api.post('/api/compliance', data)

// PUT update an existing record
export const update = (id, data) =>
  api.put(`/api/compliance/${id}`, data)

// DELETE soft-delete a record
export const remove = (id) =>
  api.delete(`/api/compliance/${id}`)

// ── Search & Stats ──────────────────────────────────────────────

// GET search by keyword
export const search = (query) =>
  api.get('/api/compliance/search', { params: { q: query } })

// GET dashboard KPI stats
export const getStats = () =>
  api.get('/api/compliance/stats')

// GET CSV export (returns blob)
export const exportCsv = () =>
  api.get('/api/compliance/export', { responseType: 'blob' })

// ── AI Analysis ────────────────────────────────────────────────

// POST get AI analysis for a record
export const getAiAnalysis = (id) =>
  api.post(`/api/compliance/${id}/analyse`)