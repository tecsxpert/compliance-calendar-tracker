import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as complianceService from '../services/complianceService'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import { formatDate, isOverdue, STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/helpers'
import { useDebounce } from '../hooks/useDebounce'

const PAGE_SIZE = 10

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow({ delay = 0 }) {
  return (
    <tr className="border-b border-slate-100 animate-pulse" style={{ animationDelay: `${delay}ms` }}>
      {[60, 200, 100, 90, 80, 80].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 bg-slate-200 rounded-full" style={{ width: w, maxWidth: '100%' }} />
          {i === 1 && <div className="h-2 bg-slate-100 rounded-full mt-2 w-28" />}
        </td>
      ))}
    </tr>
  )
}

// ── Empty Row ─────────────────────────────────────────────────────────────────
function EmptyRow({ hasFilters, onClear, onAdd }) {
  return (
    <tr><td colSpan={6}>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        {hasFilters ? (
          <>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">No records match your filters</h3>
            <p className="text-xs text-slate-400 mb-5">Try adjusting your search or filter criteria.</p>
            <button onClick={onClear} className="btn-secondary text-sm px-5 py-2">Clear Filters</button>
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">No compliance records yet</h3>
            <p className="text-xs text-slate-400 mb-5">Start by adding your first compliance record.</p>
            <button onClick={onAdd} className="btn-primary text-sm px-5 py-2">+ Add First Record</button>
          </>
        )}
      </div>
    </td></tr>
  )
}

// ── Error Row ─────────────────────────────────────────────────────────────────
function ErrorRow({ message, onRetry }) {
  return (
    <tr><td colSpan={6}>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Failed to load records</h3>
        <p className="text-xs text-slate-400 max-w-xs mb-5">{message}</p>
        <button onClick={onRetry} className="btn-secondary text-sm">↻ Try Again</button>
      </div>
    </td></tr>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ComplianceList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── State — initialised from URL params ───────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [statusFilter,   setStatusFilter]   = useState(searchParams.get('status')   || '')
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '')
  const [dateFrom,       setDateFrom]       = useState(searchParams.get('dateFrom') || '')
  const [dateTo,         setDateTo]         = useState(searchParams.get('dateTo')   || '')
  const [page,           setPage]           = useState(Number(searchParams.get('page') || 0))
  const [sortBy,         setSortBy]         = useState(searchParams.get('sortBy')   || 'id')
  const [sortDir,        setSortDir]        = useState(searchParams.get('sortDir')  || 'asc')

  const [records,        setRecords]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [totalPages,     setTotalPages]     = useState(0)
  const [totalElements,  setTotalElements]  = useState(0)
  const [exporting,      setExporting]      = useState(false)

  const debouncedSearch = useDebounce(searchInput, 300)
  const isFirstRender   = useRef(true)

  // ── Sync state → URL params ───────────────────────────────────────────────
  useEffect(() => {
    const params = {}
    if (debouncedSearch) params.search   = debouncedSearch
    if (statusFilter)    params.status   = statusFilter
    if (priorityFilter)  params.priority = priorityFilter
    if (dateFrom)        params.dateFrom = dateFrom
    if (dateTo)          params.dateTo   = dateTo
    if (page > 0)        params.page     = page
    if (sortBy !== 'id') params.sortBy   = sortBy
    if (sortDir !== 'asc') params.sortDir = sortDir
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, statusFilter, priorityFilter, dateFrom, dateTo, page, sortBy, sortDir])

  // ── Reset page when filters change ───────────────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setPage(0)
  }, [debouncedSearch, statusFilter, priorityFilter, dateFrom, dateTo])

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await complianceService.getAll({
        page, size: PAGE_SIZE, sortBy, sortDir,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter    && { status: statusFilter }),
        ...(priorityFilter  && { priority: priorityFilter }),
        ...(dateFrom        && { dateFrom }),
        ...(dateTo          && { dateTo }),
      })
      if (res.data?.content) {
        setRecords(res.data.content)
        setTotalPages(res.data.totalPages ?? 1)
        setTotalElements(res.data.totalElements ?? res.data.content.length)
      } else if (Array.isArray(res.data)) {
        setRecords(res.data)
        setTotalPages(1)
        setTotalElements(res.data.length)
      } else {
        setRecords([]); setTotalPages(0); setTotalElements(0)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.statusText || 'Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortDir, debouncedSearch, statusFilter, priorityFilter, dateFrom, dateTo])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
    setPage(0)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (e, id, title) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${title}"?\nThis cannot be undone.`)) return
    try {
      await complianceService.remove(id)
      fetchRecords()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    }
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await complianceService.exportCsv()
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `compliance-records-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // ── Clear filters ─────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearchInput(''); setStatusFilter(''); setPriorityFilter('')
    setDateFrom(''); setDateTo(''); setPage(0)
  }

  const hasFilters = !!(debouncedSearch || statusFilter || priorityFilter || dateFrom || dateTo)
  const activeFilterCount = [debouncedSearch, statusFilter, priorityFilter, dateFrom, dateTo].filter(Boolean).length

  // ── Column header ─────────────────────────────────────────────────────────
  const ColHeader = ({ col, label }) => {
    const active = sortBy === col
    return (
      <th onClick={() => handleSort(col)}
        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-slate-800 transition-colors whitespace-nowrap">
        <span className={`flex items-center gap-1 ${active ? 'text-primary-600' : ''}`}>
          {label}
          <span className="text-[10px]">
            {active ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-slate-300">↕</span>}
          </span>
        </span>
      </th>
    )
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i)
    .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
    .reduce((acc, i, idx, arr) => {
      if (idx > 0 && i - arr[idx - 1] > 1) acc.push(`e${i}`)
      acc.push(i)
      return acc
    }, [])

  return (
    <div className="page-shell space-y-4">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Records</h1>
          {!loading && !error && (
            <p className="page-subtitle">
              {totalElements} record{totalElements !== 1 ? 's' : ''}
              {hasFilters && <span className="ml-1 text-primary-500 font-medium">(filtered)</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary"
          >
            {exporting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button onClick={() => navigate('/compliance/new')} className="btn-primary">
            + New Record
          </button>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="section-panel p-4">
        <div className="flex flex-col lg:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title or description…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:bg-white transition"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-select w-full lg:w-44 py-2.5 mt-0"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="form-select w-full lg:w-40 py-2.5 mt-0"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="form-input w-full lg:w-36 py-2.5 mt-0 text-xs"
              title="Due date from"
            />
            <span className="text-slate-400 text-xs flex-shrink-0">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="form-input w-full lg:w-36 py-2.5 mt-0 text-xs"
              title="Due date to"
            />
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={clearFilters}
              className="btn-secondary whitespace-nowrap flex-shrink-0 text-xs px-3 py-2.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <ColHeader col="id"       label="ID"       />
                <ColHeader col="title"    label="Title"    />
                <ColHeader col="status"   label="Status"   />
                <ColHeader col="dueDate"  label="Due Date" />
                <ColHeader col="priority" label="Priority" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} delay={i * 60} />)}
              {!loading && error && <ErrorRow message={error} onRetry={fetchRecords} />}
              {!loading && !error && records.length === 0 && (
                <EmptyRow
                  hasFilters={hasFilters}
                  onClear={clearFilters}
                  onAdd={() => navigate('/compliance/new')}
                />
              )}
              {!loading && !error && records.map(rec => {
                const overdue = isOverdue(rec.dueDate) && rec.status !== 'COMPLIANT'
                return (
                  <tr key={rec.id} onClick={() => navigate(`/compliance/${rec.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-400">#{rec.id}</span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="text-sm font-medium text-slate-800 truncate">{rec.title}</p>
                      {rec.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{rec.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-sm ${overdue ? 'text-red-500 font-semibold' : 'text-slate-600'}`}>
                        {formatDate(rec.dueDate)}
                      </span>
                      {overdue && <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide mt-0.5">Overdue</p>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={rec.priority} />
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/compliance/${rec.id}/edit`)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all min-h-[30px]">
                          Edit
                        </button>
                        <button
                          onClick={e => handleDelete(e, rec.id, rec.title)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all min-h-[30px]">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              Page {page + 1} of {totalPages} · {totalElements} records
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                ← Prev
              </button>
              {pageNumbers.map(item =>
                String(item).startsWith('e') ? (
                  <span key={item} className="px-1.5 text-slate-300 text-xs">…</span>
                ) : (
                  <button key={item} onClick={() => setPage(item)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-all ${
                      page === item
                        ? 'bg-primary-600 border-primary-600 text-white font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-white'
                    }`}>
                    {item + 1}
                  </button>
                )
              )}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
