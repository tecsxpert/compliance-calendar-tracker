import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import * as complianceService from '../services/complianceService'

const STATUS_COLORS  = { COMPLIANT: '#10b981', NON_COMPLIANT: '#ef4444', PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6' }
const PRIORITY_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' }

const STATUS_LABELS   = { COMPLIANT: 'Compliant', NON_COMPLIANT: 'Non-Compliant', PENDING: 'Pending', IN_PROGRESS: 'In Progress' }
const PRIORITY_LABELS = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p style={{ color: payload[0].fill }} className="font-bold">{payload[0].value} records</p>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700">{payload[0].name}</p>
      <p className="font-bold" style={{ color: payload[0].payload.fill }}>{payload[0].value} records</p>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
}

export default function Analytics() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    complianceService.getStats()
      .then(r => setStats(r.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  const statusData = stats
    ? Object.entries(STATUS_LABELS).map(([key, name]) => ({
        name,
        count: stats[key.toLowerCase()] ?? stats?.byStatus?.[key] ?? 0,
        fill: STATUS_COLORS[key],
      }))
    : []

  const priorityData = stats?.byPriority
    ? Object.entries(stats.byPriority).map(([key, count]) => ({
        name: PRIORITY_LABELS[key] ?? key,
        count,
        fill: PRIORITY_COLORS[key] ?? '#94a3b8',
      }))
    : []

  const complianceRate = stats?.total > 0
    ? Math.round(((stats.compliant ?? 0) / stats.total) * 100)
    : 0

  return (
    <div className="page-shell space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Visual breakdown of your compliance data</p>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Records',    value: stats?.total,       color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Compliant',        value: stats?.compliant,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Non-Compliant',    value: stats?.nonCompliant ?? stats?.non_compliant, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Compliance Rate',  value: `${complianceRate}%`, color: 'text-blue-600',  bg: 'bg-blue-50'    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card text-center py-5">
            {loading
              ? <div className="h-8 bg-slate-100 rounded-xl animate-pulse mx-auto w-16 mb-2" />
              : <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
            }
            <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Status Bar Chart */}
        <div className="card">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Records by Status</h2>
          <p className="text-xs text-slate-400 mb-5">Distribution across all compliance statuses</p>
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} barSize={40} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority Pie Chart */}
        <div className="card">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Records by Priority</h2>
          <p className="text-xs text-slate-400 mb-5">Breakdown of task urgency levels</p>
          {loading ? <ChartSkeleton /> : priorityData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
              No priority data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {priorityData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={v => <span className="text-xs text-slate-600">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Compliance rate progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Overall Compliance Rate</h2>
            <p className="text-xs text-slate-400 mt-0.5">Percentage of compliant records</p>
          </div>
          {!loading && (
            <span className={`text-2xl font-bold ${complianceRate >= 75 ? 'text-emerald-600' : complianceRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {complianceRate}%
            </span>
          )}
        </div>
        {loading
          ? <div className="h-4 bg-slate-100 rounded-full animate-pulse" />
          : (
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  complianceRate >= 75 ? 'bg-emerald-500' : complianceRate >= 40 ? 'bg-amber-400' : 'bg-red-500'
                }`}
                style={{ width: `${complianceRate}%` }}
              />
            </div>
          )
        }
        {!loading && (
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>0%</span>
            <span className="text-slate-500">Target: 80%</span>
            <span>100%</span>
          </div>
        )}
      </div>
    </div>
  )
}
