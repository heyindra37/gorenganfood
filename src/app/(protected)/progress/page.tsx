'use client'
import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { levelFor, levelProgress } from '@/lib/engine/xp'
import type { DailyLog, Streak } from '@/types'

export default function ProgressPage() {
  const [data, setData] = useState<{ settings: { total_xp: number } | null; streak: Streak | null; weeklyLogs: DailyLog[] } | null>(null)

  const fetchData = useCallback(async () => {
    const [settingsRes, streakRes, logsRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/streak'),
      fetch('/api/daily'),
    ])
    const [s, st, l] = await Promise.all([settingsRes.json(), streakRes.json(), logsRes.json()])
    setData({ settings: s.settings, streak: st.streak, weeklyLogs: [] })

    // Fetch weekly logs
    const weekDays: string[] = []
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d)
      dd.setDate(diff + i)
      weekDays.push(dd.toISOString().slice(0, 10))
    }
    const weekRes = await fetch('/api/history-week')
    const weekData = weekRes.ok ? await weekRes.json() : { logs: [] }
    setData({ settings: s.settings, streak: st.streak, weeklyLogs: weekData.logs || [] })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (!data) return <div className="p-6 text-gray-400">Memuat...</div>

  const totalXp = data.settings?.total_xp || 0
  const level = levelFor(totalXp)
  const { pct, xpInLevel, xpNeeded } = levelProgress(totalXp)

  const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)

  const weekChartData = DAYS.map((label, i) => {
    const dd = new Date()
    dd.setDate(diff + i)
    const dateStr = dd.toISOString().slice(0, 10)
    const log = data.weeklyLogs.find(l => l.log_date === dateStr)
    return { label, score: log?.daily_score || 0, today: i === (day === 0 ? 6 : day - 1) }
  })

  const weeklyScore = weekChartData.reduce((sum, d) => sum + d.score, 0)

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Progress</h1>

      {/* Level card */}
      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-purple-300 text-sm font-medium uppercase tracking-wider">Level {level.level}</div>
            <div className="text-3xl font-bold text-white mt-1">{level.title}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-300">{totalXp.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Total XP</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress level</span>
            <span>{xpInLevel.toLocaleString()} / {level.ceiling === Infinity ? '∞' : xpNeeded.toLocaleString()} XP</span>
          </div>
          <div className="bg-gray-800/60 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {level.ceiling !== Infinity && (
            <div className="text-xs text-gray-500 text-right">{(level.ceiling + 1 - totalXp).toLocaleString()} XP ke level berikutnya</div>
          )}
        </div>
      </div>

      {/* Skor mingguan */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Skor Mingguan</h2>
          <div className={`text-xl font-bold ${weeklyScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weeklyScore > 0 ? '+' : ''}{weeklyScore}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
            <Bar dataKey="score" name="Skor" radius={[4,4,0,0]}>
              {weekChartData.map((entry, i) => (
                <Cell key={i} fill={entry.today ? '#22c55e' : entry.score >= 0 ? '#3b82f6' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Streak info */}
      {data.streak && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-orange-900/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">{data.streak.current_streak}</div>
            <div className="text-xs text-gray-400 mt-1">🔥 Streak Aktif</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{data.streak.longest_streak}</div>
            <div className="text-xs text-gray-400 mt-1">🏆 Streak Terpanjang</div>
          </div>
        </div>
      )}

      {/* Level table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h2 className="font-semibold text-white mb-3">Level Progression</h2>
        <div className="space-y-1">
          {[
            { l: 1, title: 'Pemula', min: 0, max: 99 },
            { l: 2, title: 'Belajar Disiplin', min: 100, max: 299 },
            { l: 3, title: 'Konsisten', min: 300, max: 699 },
            { l: 4, title: 'Disiplin', min: 700, max: 1499 },
            { l: 5, title: 'Master', min: 1500, max: 2999 },
            { l: 6, title: 'Grandmaster', min: 3000, max: 5999 },
            { l: 7, title: 'Legend', min: 6000, max: 9999 },
            { l: 8, title: 'Living Legend', min: 10000, max: null },
          ].map(row => (
            <div key={row.l} className={`flex items-center gap-3 py-1.5 px-2 rounded-lg text-sm ${row.l === level.level ? 'bg-purple-900/30 border border-purple-700/50' : ''}`}>
              <span className="text-gray-500 w-5">{row.l}</span>
              <span className={row.l <= level.level ? 'text-white' : 'text-gray-500'}>{row.title}</span>
              <span className="ml-auto text-gray-500 text-xs">{row.min.toLocaleString()}{row.max ? `–${row.max.toLocaleString()}` : '+'}</span>
              {row.l < level.level && <span className="text-green-400 text-xs">✓</span>}
              {row.l === level.level && <span className="text-purple-400 text-xs">▶</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
