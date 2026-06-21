'use client'
import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { consistencyPct, weeklyConsistency } from '@/lib/engine/consistency'
import { cn } from '@/lib/utils'
import type { DailyLog } from '@/types'

export default function ConsistencyPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [startDate, setStartDate] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [logsRes, settingsRes] = await Promise.all([
      fetch('/api/history-all'),
      fetch('/api/settings'),
    ])
    const [logsData, settingsData] = await Promise.all([logsRes.json(), settingsRes.json()])
    setLogs(logsData.logs || [])
    setStartDate(settingsData.goals?.start_date || new Date().toISOString().slice(0, 10))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (!startDate) return <div className="p-6 text-gray-400">Memuat...</div>

  const { pct, cleanDays, totalDays } = consistencyPct(logs, startDate)
  const weekly = weeklyConsistency(logs, startDate)

  // Build trend chart data (rolling consistency per week)
  let runningClean = 0
  let runningTotal = 0
  const trendData = weekly.map(w => {
    runningClean += w.cleanDays
    runningTotal += w.totalDays
    return {
      week: w.weekStart.slice(5),
      pct: runningTotal > 0 ? Math.round((runningClean / runningTotal) * 100) : 0,
    }
  })

  const pctColor = pct >= 90 ? 'text-green-400' : pct >= 70 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Konsistensi</h1>

      {/* Main gauge */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
        <div className={cn('text-6xl font-bold mb-2', pctColor)}>{pct}%</div>
        <div className="text-gray-400 text-sm mb-4">dari target 90%</div>
        <div className="bg-gray-800 rounded-full h-4 max-w-xs mx-auto">
          <div
            className={cn('h-4 rounded-full transition-all', pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500')}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 max-w-xs mx-auto mt-1.5">
          <span>0%</span>
          <span className="text-green-400">90% target</span>
          <span>100%</span>
        </div>
        <div className="mt-4 flex gap-6 justify-center text-sm">
          <div>
            <span className="text-green-400 font-bold">{cleanDays}</span>
            <span className="text-gray-400"> hari bersih</span>
          </div>
          <div>
            <span className="text-gray-300 font-bold">{totalDays}</span>
            <span className="text-gray-400"> total hari</span>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="font-semibold text-white mb-4">Tren Konsistensi</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Konsistensi']}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              />
              <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '90%', fill: '#22c55e', fontSize: 10 }} />
              <Area type="monotone" dataKey="pct" stroke="#60a5fa" fill="#1e40af55" strokeWidth={2} name="%" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly breakdown */}
      {weekly.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="font-semibold text-white mb-3">Breakdown Mingguan</h2>
          <div className="space-y-2">
            {[...weekly].reverse().slice(0, 8).map(w => (
              <div key={w.weekStart} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20">W/{w.weekStart.slice(5)}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full', w.pct >= 90 ? 'bg-green-500' : w.pct >= 70 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${w.pct}%` }}
                  />
                </div>
                <span className={cn('text-sm font-medium w-10 text-right', w.pct >= 90 ? 'text-green-400' : w.pct >= 70 ? 'text-yellow-400' : 'text-red-400')}>
                  {w.pct}%
                </span>
                <span className="text-xs text-gray-500">{w.cleanDays}/{w.totalDays}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
