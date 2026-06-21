'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import { differenceInDays, parseISO } from 'date-fns'
import type { WeightLog, UserGoals } from '@/types'

export default function WeightPage() {
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [goals, setGoals] = useState<UserGoals | null>(null)
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/weight')
    const json = await res.json()
    setLogs(json.logs || [])
    setGoals(json.goals)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: parseFloat(weight) }),
      })
      if (res.ok) {
        toast.success('✅ Berat badan dicatat!')
        setWeight('')
        await fetchData()
      } else {
        const j = await res.json()
        toast.error(j.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const latest = logs[logs.length - 1]
  const startWeight = goals?.starting_weight_kg
  const targetWeight = goals?.target_weight_kg
  const daysRemaining = goals?.target_date
    ? differenceInDays(parseISO(goals.target_date), new Date())
    : null

  const progressPct = startWeight && targetWeight && latest
    ? Math.min(100, Math.max(0, Math.round(
        ((startWeight - latest.weight_kg) / (startWeight - targetWeight)) * 100
      )))
    : 0

  const chartData = logs.map(l => ({
    date: l.log_date.slice(5),
    berat: Number(l.weight_kg),
  }))

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Berat Badan & Goal</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{latest ? `${latest.weight_kg} kg` : '-'}</div>
          <div className="text-xs text-gray-500 mt-1">Berat Sekarang</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-400">{targetWeight ? `${targetWeight} kg` : '-'}</div>
          <div className="text-xs text-gray-500 mt-1">Target</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{daysRemaining !== null ? `${daysRemaining}` : '-'}</div>
          <div className="text-xs text-gray-500 mt-1">Hari Tersisa</div>
        </div>
      </div>

      {/* Progress bar */}
      {goals && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progres menuju target</span>
            <span className="text-white font-semibold">{progressPct}%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1.5">
            <span>Awal: {startWeight} kg</span>
            <span>Target: {targetWeight} kg</span>
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleLog} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Berat hari ini (kg)"
          required
          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
        >
          Catat
        </button>
      </form>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold text-white mb-4">Grafik Berat Badan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
              <Legend />
              {targetWeight && (
                <ReferenceLine y={targetWeight} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Target', fill: '#22c55e', fontSize: 11 }} />
              )}
              <Line type="monotone" dataKey="berat" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} name="Berat (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log list */}
      {logs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold text-white mb-3">Riwayat Log</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...logs].reverse().map(l => (
              <div key={l.id} className="flex justify-between text-sm py-1.5 border-b border-gray-800 last:border-0">
                <span className="text-gray-400">{l.log_date}</span>
                <span className="text-white font-medium">{l.weight_kg} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
