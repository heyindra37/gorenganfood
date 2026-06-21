'use client'
import { useState, useEffect, useCallback } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { subDays, format } from 'date-fns'
import type { DailyLog } from '@/types'

function getHeatClass(log: DailyLog | undefined): string {
  if (!log) return 'color-empty'
  if (log.wajib_count > 0) return 'color-violation'
  if (log.sebaiknya_count > 0) return 'color-dirty'
  if (log.daily_score >= 10) return 'color-scale-4'
  if (log.daily_score >= 5) return 'color-scale-3'
  if (log.daily_score >= 2) return 'color-scale-2'
  if (log.daily_score > 0) return 'color-scale-1'
  return 'color-empty'
}

export default function HeatmapPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/history-all')
    const json = await res.json()
    setLogs(json.logs || [])
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const logMap = new Map(logs.map(l => [l.log_date, l]))
  const today = new Date()
  const startDate = subDays(today, 180)

  const heatValues = logs.map(l => ({ date: l.log_date, count: l.daily_score, log: l }))

  const totalLogged = logs.length
  const avgScore = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.daily_score, 0) / logs.length) : 0
  const bestDay = logs.reduce((best, l) => l.daily_score > (best?.daily_score || -Infinity) ? l : best, null as DailyLog | null)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Heatmap Kalender</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{totalLogged}</div>
          <div className="text-xs text-gray-400">Hari dilog</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${avgScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>{avgScore > 0 ? '+' : ''}{avgScore}</div>
          <div className="text-xs text-gray-400">Rata-rata skor</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{bestDay ? `+${bestDay.daily_score}` : '-'}</div>
          <div className="text-xs text-gray-400">Skor terbaik</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="overflow-x-auto">
          <CalendarHeatmap
            startDate={startDate}
            endDate={today}
            values={heatValues}
            classForValue={(value) => {
              if (!value) return 'color-empty'
              return getHeatClass(value.log)
            }}
            titleForValue={(value) => {
              if (!value) return 'No data'
              const log = value.log as DailyLog
              return `${log.log_date}: Skor ${log.daily_score}, ${log.is_clean_day ? 'Bersih' : 'Ada Pelanggaran'}`
            }}
            showWeekdayLabels
          />
        </div>
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {[
            { cls: 'color-empty', label: 'Tidak dilog' },
            { cls: 'color-scale-1', label: 'Positif ringan' },
            { cls: 'color-scale-4', label: 'Sangat positif' },
            { cls: 'color-dirty', label: 'Ada pelanggaran sebaiknya' },
            { cls: 'color-violation', label: 'Ada pelanggaran wajib' },
          ].map(({ cls, label }) => (
            <div key={cls} className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className={`w-3 h-3 rounded-sm ${cls === 'color-empty' ? 'bg-gray-700' : cls === 'color-scale-1' ? 'bg-green-900' : cls === 'color-scale-4' ? 'bg-green-500' : cls === 'color-dirty' ? 'bg-red-900' : 'bg-red-600'}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
