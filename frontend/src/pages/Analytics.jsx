import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'
import * as complianceService from '../services/complianceService'

const STATUS_COLORS  = { COMPLIANT: '#10b981', NON_COMPLIANT: '#ef4444', PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6' }
const STATUS_LABELS   = { COMPLIANT: 'Compliant', NON_COMPLIANT: 'Non-Compliant', PENDING: 'Pending', IN_PROGRESS: 'In Progress' }

const CATEGORY_COLORS = {
  Privacy: '#8b5cf6',
  Finance: '#ec4899',
  HR: '#f97316',
  Security: '#06b6d4',
  General: '#64748b'
}

function getCategory(title = '') {
  const t = title.toLowerCase()
  if (t.includes('data') || t.includes('gdpr') || t.includes('privacy')) return 'Privacy'
  if (t.includes('tax') || t.includes('finance') || t.includes('audit')) return 'Finance'
  if (t.includes('hr') || t.includes('employee') || t.includes('train')) return 'HR'
  if (t.includes('security') || t.includes('iso') || t.includes('soc')) return 'Security'
  return 'General'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-xl px-4 py-3 text-sm font-sans z-50">
      <p className="font-semibold text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <p className="font-medium">
            <span className="text-slate-400 mr-2">{p.name}:</span>
            <span className="font-bold">{p.value}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-xl px-4 py-3 text-sm font-sans z-50">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
        <p className="font-semibold">{payload[0].name}</p>
      </div>
      <p className="font-bold mt-1.5 ml-4">{payload[0].value} records</p>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-64 bg-slate-50 rounded-xl animate-pulse w-full" />
}

export default function Analytics() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [period,  setPeriod]  = useState('30days') // 7days, 30days, all

  useEffect(() => {
    setLoading(true)
    // Fetch all to aggregate on client side, allowing dynamic period filtering
    complianceService.getAll()
      .then(r => setRecords(r.data || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load analytics data.'))
      .finally(() => setLoading(false))
  }, [])

  // Process Data based on Period
  const { filteredRecords, statusData, categoryData, trendData, summary } = useMemo(() => {
    let filtered = records
    const now = new Date()

    if (period === '7days') {
      const cutoff = new Date(now.setDate(now.getDate() - 7))
      filtered = records.filter(r => new Date(r.createdAt || r.dueDate) >= cutoff)
    } else if (period === '30days') {
      const cutoff = new Date(now.setDate(now.getDate() - 30))
      filtered = records.filter(r => new Date(r.createdAt || r.dueDate) >= cutoff)
    }

    // 1. Status Data (Pie Chart)
    const statusCounts = {}
    filtered.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
    })
    const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
      name: label,
      value: statusCounts[key] || 0,
      fill: STATUS_COLORS[key]
    })).filter(d => d.value > 0)

    // 2. Category Data (Bar Chart)
    const categoryCounts = {}
    filtered.forEach(r => {
      const cat = getCategory(r.title)
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })
    const categoryData = Object.keys(CATEGORY_COLORS).map(cat => ({
      name: cat,
      count: categoryCounts[cat] || 0,
      fill: CATEGORY_COLORS[cat]
    })).filter(d => d.count > 0)
    
    // Sort category data by count descending
    categoryData.sort((a, b) => b.count - a.count)

    // 3. Trend Data (Line Chart over time)
    const trendMap = {}
    // Group by date (YYYY-MM-DD)
    filtered.forEach(r => {
      const dateStr = (r.createdAt || r.dueDate || '').split('T')[0]
      if (dateStr) {
        if (!trendMap[dateStr]) trendMap[dateStr] = { date: dateStr, count: 0, compliant: 0, nonCompliant: 0 }
        trendMap[dateStr].count += 1
        if (r.status === 'COMPLIANT') trendMap[dateStr].compliant += 1
        if (r.status === 'NON_COMPLIANT') trendMap[dateStr].nonCompliant += 1
      }
    })
    const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date))

    // 4. Summary Stats
    const total = filtered.length
    const compliant = filtered.filter(r => r.status === 'COMPLIANT').length
    const nonCompliant = filtered.filter(r => r.status === 'NON_COMPLIANT').length
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0

    return { filteredRecords: filtered, statusData, categoryData, trendData, summary: { total, compliant, nonCompliant, complianceRate } }
  }, [records, period])

  return (
    <div className="page-shell space-y-6 max-w-7xl mx-auto">
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Interactive compliance data insights and trends</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setPeriod('7days')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${period === '7days' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            7 Days
          </button>
          <button 
            onClick={() => setPeriod('30days')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${period === '30days' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            30 Days
          </button>
          <button 
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${period === 'all' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All Time
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Records',    value: summary.total,       color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Compliant',        value: summary.compliant,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Non-Compliant',    value: summary.nonCompliant, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Compliance Rate',  value: `${summary.complianceRate}%`, color: 'text-blue-600',  bg: 'bg-blue-50'    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card text-center py-6 hover:shadow-md transition-shadow">
            {loading ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse mx-auto w-20 mb-2" />
            ) : (
              <p className={`text-4xl font-black ${color}`}>{value ?? 0}</p>
            )}
            <p className="text-sm text-slate-500 font-semibold mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Over Time (Line Chart) - Spans 2 columns */}
        <div className="card lg:col-span-2 flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-1">Compliance Trend</h2>
          <p className="text-xs text-slate-400 mb-6">Volume of records added over time</p>
          
          <div className="flex-1 min-h-[300px]">
            {loading ? <ChartSkeleton /> : trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">No trend data for selected period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Total Records" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Breakdown (Pie Chart) */}
        <div className="card flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-1">Status Distribution</h2>
          <p className="text-xs text-slate-400 mb-6">Current state of compliance tasks</p>
          
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            {loading ? <ChartSkeleton /> : statusData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">No status data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    iconSize={10}
                    formatter={(v) => <span className="text-xs font-semibold text-slate-700 ml-1">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown (Bar Chart) - Spans full width */}
        <div className="card lg:col-span-3 flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-1">Records by Category</h2>
          <p className="text-xs text-slate-400 mb-6">Inferred categories based on record titles</p>
          
          <div className="flex-1 min-h-[300px]">
            {loading ? <ChartSkeleton /> : categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">No category data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" name="Records" radius={[6, 6, 0, 0]}>
                    {categoryData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
