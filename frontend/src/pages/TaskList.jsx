import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import { formatDate, isOverdue } from '../utils/helpers'

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {[200, 90, 80, 70, 60].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 bg-slate-100 rounded-full" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function TaskList() {
  const navigate = useNavigate()
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/compliance')
      const data = res.data?.content ?? (Array.isArray(res.data) ? res.data : [])
      setTasks(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tasks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const stats = {
    total:      tasks.length,
    completed:  tasks.filter(t => t.status === 'COMPLIANT').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    overdue:    tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'COMPLIANT').length,
  }

  const kpis = [
    { label: 'Total',       value: stats.total,      color: 'bg-slate-100',   text: 'text-slate-600'  },
    { label: 'Compliant',   value: stats.completed,  color: 'bg-emerald-100', text: 'text-emerald-600' },
    { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-100',    text: 'text-blue-600'   },
    { label: 'Overdue',     value: stats.overdue,    color: 'bg-red-100',     text: 'text-red-600'    },
  ]

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Unable to Load Tasks</h3>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button onClick={loadTasks} className="btn-secondary">↻ Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task List</h1>
          <p className="page-subtitle">Manage and track all compliance tasks</p>
        </div>
        <button onClick={() => navigate('/compliance/new')} className="btn-primary">
          + New Task
        </button>
      </div>

      {/* KPI Cards */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, color, text }) => (
            <div key={label} className="card flex items-center gap-4 py-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <span className={`text-lg font-bold ${text}`}>{value}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">All Tasks</h2>
        </div>

        {loading ? (
          <table className="w-full">
            <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">No tasks yet</p>
            <p className="text-xs text-slate-400 mb-5">Create your first compliance record to see it here.</p>
            <button onClick={() => navigate('/compliance/new')} className="btn-primary text-sm px-5 py-2">
              + Create Task
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Task', 'Status', 'Due Date', 'Priority', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map(task => {
                  const overdue = isOverdue(task.dueDate) && task.status !== 'COMPLIANT'
                  return (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/compliance/${task.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800">{task.title || 'Untitled'}</p>
                          {overdue && (
                            <span className="badge bg-red-100 text-red-700 ring-red-200 text-[10px]">Overdue</span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`text-sm ${overdue ? 'text-red-500 font-semibold' : 'text-slate-600'}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/compliance/${task.id}/edit`)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{tasks.length}</span> task{tasks.length !== 1 ? 's' : ''}
              {' · '}{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
