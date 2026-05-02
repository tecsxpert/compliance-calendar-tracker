import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import * as complianceService from '../services/complianceService'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, isOverdue } from '../utils/helpers'

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, loading }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {loading
          ? <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-slate-800">{value ?? 0}</p>
        }
      </div>
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-primary-600 font-bold">{payload[0].value} records</p>
    </div>
  )
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {[160, 90, 80, 70].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-100 rounded-full" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const BAR_COLORS = {
  COMPLIANT:     '#10b981',
  NON_COMPLIANT: '#ef4444',
  PENDING:       '#f59e0b',
  IN_PROGRESS:   '#3b82f6',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats]       = useState(null)
  const [recent, setRecent]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [recLoading, setRecLoading] = useState(true)

  useEffect(() => {
    complianceService.getStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))

    complianceService.getAll({ page: 0, size: 5, sortBy: 'dueDate', sortDir: 'asc' })
      .then(r => {
        const data = r.data?.content ?? (Array.isArray(r.data) ? r.data : [])
        setRecent(data)
      })
      .catch(() => setRecent([]))
      .finally(() => setRecLoading(false))
  }, [])

  const kpis = [
    {
      label: 'Total Records',
      value: stats?.total,
      color: 'bg-primary-50',
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Compliant',
      value: stats?.compliant,
      color: 'bg-emerald-50',
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending',
      value: stats?.pending,
      color: 'bg-amber-50',
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Overdue',
      value: stats?.overdue,
      color: 'bg-red-50',
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ]

  const chartData = stats?.byStatus
    ? Object.entries(stats.byStatus).map(([name, count]) => ({ name, count }))
    : [
        { name: 'COMPLIANT',     count: stats?.compliant ?? 0 },
        { name: 'NON_COMPLIANT', count: stats?.nonCompliant ?? 0 },
        { name: 'PENDING',       count: stats?.pending ?? 0 },
        { name: 'IN_PROGRESS',   count: stats?.inProgress ?? 0 },
      ]

  const chartLabels = {
    COMPLIANT: 'Compliant', NON_COMPLIANT: 'Non-Compliant',
    PENDING: 'Pending', IN_PROGRESS: 'In Progress',
  }

  return (
    <div className="page-shell space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your compliance status</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <KpiCard key={k.label} {...k} loading={loading} />
        ))}
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Bar Chart */}
        <div className="card xl:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Records by Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">Current distribution</p>
            </div>
          </div>
          {loading ? (
            <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={36} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickFormatter={n => chartLabels[n] ?? n}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={BAR_COLORS[entry.name] ?? '#1B4F8A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card xl:col-span-2 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Compliance Rate</h2>
            <p className="text-xs text-slate-400 mt-0.5">Based on current records</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {[
                { label: 'Compliant',     value: stats?.compliant ?? 0,    total: stats?.total ?? 1, color: 'bg-emerald-500' },
                { label: 'Pending',       value: stats?.pending ?? 0,      total: stats?.total ?? 1, color: 'bg-amber-400'   },
                { label: 'Non-Compliant', value: stats?.nonCompliant ?? 0, total: stats?.total ?? 1, color: 'bg-red-500'     },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 font-medium">{label}</span>
                      <span className="text-slate-500">{value} <span className="text-slate-300">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={() => navigate('/compliance/new')}
            className="btn-primary w-full mt-auto"
          >
            + New Record
          </button>
        </div>
      </div>

      {/* Recent Records */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Recent Records</h2>
          <button
            onClick={() => navigate('/compliance')}
            className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Title', 'Status', 'Due Date', 'Priority'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                : recent.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">
                        No records yet.{' '}
                        <button onClick={() => navigate('/compliance/new')} className="text-primary-600 font-semibold hover:underline">
                          Add one
                        </button>
                      </td>
                    </tr>
                  )
                  : recent.map(rec => (
                    <tr
                      key={rec.id}
                      onClick={() => navigate(`/compliance/${rec.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{rec.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${isOverdue(rec.dueDate) && rec.status !== 'COMPLIANT' ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                          {formatDate(rec.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{rec.priority ?? '—'}</span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
