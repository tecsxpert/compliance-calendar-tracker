import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP = {
  COMPLIANT:     { label: 'Compliant',     cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  NON_COMPLIANT: { label: 'Non-Compliant', cls: 'bg-red-100 text-red-800 ring-red-200'             },
  PENDING:       { label: 'Pending',       cls: 'bg-amber-100 text-amber-800 ring-amber-200'       },
  IN_PROGRESS:   { label: 'In Progress',   cls: 'bg-blue-100 text-blue-800 ring-blue-200'          },
}

function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] ?? {
    label: status,
    cls: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const colour =
    pct >= 75 ? 'bg-emerald-500' :
    pct >= 40 ? 'bg-amber-400'   : 'bg-red-500'

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-slate-600 w-7 text-right">{pct}</span>
    </div>
  )
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ delay = 0 }) {
  return (
    <tr
      className="border-b border-slate-100 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      {[72, 180, 100, 90, 80].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 bg-slate-200 rounded-full" style={{ width: `${w}px`, maxWidth: '100%' }} />
          {i === 1 && (
            <div className="h-2 bg-slate-100 rounded-full mt-2" style={{ width: '120px' }} />
          )}
        </td>
      ))}
      <td className="px-4 py-4">
        <div className="flex gap-2">
          <div className="h-7 w-12 bg-slate-200 rounded-lg" />
          <div className="h-7 w-14 bg-slate-200 rounded-lg" />
        </div>
      </td>
    </tr>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">No compliance records yet</h3>
          <p className="text-sm text-slate-400 max-w-xs mb-6">
            Start by adding your first compliance item. All records will appear here.
          </p>
          <button onClick={onAdd} className="btn-primary text-sm px-5 py-2 min-h-[40px]">
            + Add First Record
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }) {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Failed to load records</h3>
          <p className="text-sm text-slate-400 max-w-xs mb-6">{message}</p>
          <button onClick={onRetry} className="btn-secondary text-sm px-5 py-2 min-h-[40px]">
            ↻ Try Again
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function ComplianceList() {
  const navigate = useNavigate()

  const [records, setRecords]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [page, setPage]                 = useState(0)          // Spring Boot: 0-based
  const [totalPages, setTotalPages]     = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy]             = useState('id')
  const [sortDir, setSortDir]           = useState('asc')

  // ── Fetch records ─────────────────────────────────────────────────────────

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/compliance', {
        params: { page, size: PAGE_SIZE, sortBy, sortDir },
      })

      // Handle Spring Page<T> response or plain array
      if (res.data?.content) {
        setRecords(res.data.content)
        setTotalPages(res.data.totalPages ?? 1)
        setTotalElements(res.data.totalElements ?? res.data.content.length)
      } else if (Array.isArray(res.data)) {
        setRecords(res.data)
        setTotalPages(1)
        setTotalElements(res.data.length)
      } else {
        setRecords([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.statusText ||
        'Could not connect to server. Is the backend running on port 8080?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortDir])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // ── Sort toggle ───────────────────────────────────────────────────────────

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(0)
  }

  // ── Soft delete ───────────────────────────────────────────────────────────

  const handleDelete = async (e, id, title) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${title}"?\nThis action cannot be undone.`)) return
    try {
      await api.delete(`/api/compliance/${id}`)
      fetchRecords()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed. Please try again.')
    }
  }

  // ── Column header ─────────────────────────────────────────────────────────

  const ColHeader = ({ col, label }) => {
    const active = sortBy === col
    const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
    return (
      <th
        onClick={() => handleSort(col)}
        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase
          tracking-wider cursor-pointer select-none hover:text-slate-800
          hover:bg-slate-100 transition-colors duration-100 whitespace-nowrap"
      >
        <span className={active ? 'text-slate-800' : ''}>
          {label}
          <span className="ml-1 text-blue-500">{arrow}</span>
        </span>
      </th>
    )
  }

  // ── Pagination helpers ────────────────────────────────────────────────────

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i)
    .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
    .reduce((acc, i, idx, arr) => {
      if (idx > 0 && i - arr[idx - 1] > 1) acc.push('ellipsis-' + i)
      acc.push(i)
      return acc
    }, [])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Compliance Records</h1>
          {!loading && !error && (
            <p className="text-sm text-slate-400 mt-0.5">
              {totalElements} record{totalElements !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/compliance/new')}
          className="btn-primary self-start sm:self-auto"
        >
          + New Record
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <ColHeader col="id"      label="ID"       />
                <ColHeader col="title"   label="Title"    />
                <ColHeader col="status"  label="Status"   />
                <ColHeader col="dueDate" label="Due Date" />
                <ColHeader col="score"   label="Score"    />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {/* ── Loading ── */}
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} delay={i * 80} />
              ))}

              {/* ── Error ── */}
              {!loading && error && (
                <ErrorState message={error} onRetry={fetchRecords} />
              )}

              {/* ── Empty ── */}
              {!loading && !error && records.length === 0 && (
                <EmptyState onAdd={() => navigate('/compliance/new')} />
              )}

              {/* ── Data rows ── */}
              {!loading && !error && records.map((rec) => (
                <tr
                  key={rec.id}
                  onClick={() => navigate(`/compliance/${rec.id}`)}
                  className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                >
                  {/* ID */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-slate-400">#{rec.id}</span>
                  </td>

                  {/* Title + description */}
                  <td className="px-4 py-4 max-w-[220px]">
                    <p className="text-sm font-medium text-slate-800 truncate">{rec.title}</p>
                    {rec.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{rec.description}</p>
                    )}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status={rec.status} />
                  </td>

                  {/* Due date */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      isOverdue(rec.dueDate) && rec.status !== 'COMPLIANT'
                        ? 'text-red-500 font-medium'
                        : 'text-slate-600'
                    }`}>
                      {formatDate(rec.dueDate)}
                    </span>
                    {isOverdue(rec.dueDate) && rec.status !== 'COMPLIANT' && (
                      <p className="text-[10px] text-red-400 font-semibold mt-0.5 uppercase tracking-wide">
                        Overdue
                      </p>
                    )}
                  </td>

                  {/* Score bar */}
                  <td className="px-4 py-4 min-w-[130px]">
                    <ScoreBar score={rec.score} />
                  </td>

                  {/* Action buttons — stop row click propagation */}
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/compliance/${rec.id}/edit`) }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600
                          hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700
                          transition-all duration-150 min-h-[32px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, rec.id, rec.title)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600
                          hover:bg-red-50 hover:border-red-200 hover:text-red-600
                          transition-all duration-150 min-h-[32px]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3
            px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              Page {page + 1} of {totalPages} · {totalElements} total records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200
                  text-slate-600 hover:bg-white disabled:opacity-30
                  disabled:cursor-not-allowed transition-all min-h-[32px]"
              >
                ← Prev
              </button>

              {pageNumbers.map((item, i) =>
                String(item).startsWith('ellipsis') ? (
                  <span key={item} className="px-2 text-slate-300 text-xs select-none">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-all duration-150 ${
                      page === item
                        ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {item + 1}
                  </button>
                )
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200
                  text-slate-600 hover:bg-white disabled:opacity-30
                  disabled:cursor-not-allowed transition-all min-h-[32px]"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}