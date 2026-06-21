'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatDurationSeconds, formatDuration } from '@/lib/utils'
import type { FastingSession } from '@/types'

interface FastingData {
  active: FastingSession | null
  history: FastingSession[]
}

export default function FastingPage() {
  const [data, setData] = useState<FastingData | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/fasting')
    const json = await res.json()
    setData(json)
    if (json.active) {
      const secs = Math.floor((Date.now() - new Date(json.active.started_at).getTime()) / 1000)
      setElapsed(secs)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!data?.active) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(data.active!.started_at).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [data?.active])

  async function toggleFasting() {
    setLoading(true)
    try {
      const res = await fetch('/api/fasting', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error)
      } else if (json.stopped) {
        toast.success(`⏸️ Fasting selesai! Durasi: ${formatDuration(json.durationMinutes)}`)
      } else {
        toast.success('▶️ Fasting dimulai!')
      }
      await fetchData()
    } finally {
      setLoading(false)
    }
  }

  const active = data?.active
  const history = data?.history || []

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Intermittent Fasting</h1>

      {/* Timer card */}
      <div className={`rounded-2xl p-8 border text-center ${active ? 'bg-green-950/30 border-green-800' : 'bg-gray-900 border-gray-800'}`}>
        {active ? (
          <>
            <div className="text-green-400 text-sm font-medium mb-3 uppercase tracking-wider">Sedang Fasting</div>
            <div className="font-mono text-5xl font-bold text-white mb-2 tabular-nums">
              {formatDurationSeconds(elapsed)}
            </div>
            <div className="text-gray-400 text-sm mb-2">
              {(elapsed / 3600).toFixed(1)} jam berjalan
            </div>
            <div className="text-gray-500 text-xs mb-6">
              Mulai: {new Date(active.started_at).toLocaleString('id-ID')}
            </div>
            {elapsed >= 57600 && elapsed < 61200 && (
              <div className="text-yellow-400 text-sm mb-4">⚡ Hampir 16 jam!</div>
            )}
            {elapsed >= 61200 && (
              <div className="text-green-400 text-sm font-semibold mb-4">✅ 16+ jam tercapai!</div>
            )}
            <button
              onClick={toggleFasting}
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              ⏹ Stop Fasting
            </button>
          </>
        ) : (
          <>
            <div className="text-gray-400 text-sm mb-3 uppercase tracking-wider">Tidak Fasting</div>
            <div className="text-gray-600 text-5xl font-mono mb-6">--:--:--</div>
            {history.length > 0 && (
              <p className="text-gray-500 text-sm mb-6">
                Sesi terakhir: {formatDuration(history[0].duration_minutes || 0)} —{' '}
                {new Date(history[0].ended_at!).toLocaleString('id-ID')}
              </p>
            )}
            <button
              onClick={toggleFasting}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              ▶ Mulai Fasting
            </button>
          </>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <section className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h2 className="font-semibold text-white mb-4">Riwayat Sesi</h2>
          <div className="space-y-2">
            {history.map(session => (
              <div key={session.id} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                <div>
                  <div className="text-sm text-gray-200">
                    {new Date(session.started_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {new Date(session.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {' s/d '}
                    {session.ended_at && new Date(session.ended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {session.end_reason === 'auto_restart' && (
                    <div className="text-xs text-orange-400 mt-0.5">🔄 Auto-restart (makanan/minuman dilog)</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">{formatDuration(session.duration_minutes || 0)}</div>
                  <div className={`text-xs ${(session.duration_minutes || 0) >= 960 ? 'text-green-400' : 'text-gray-500'}`}>
                    {((session.duration_minutes || 0) / 60).toFixed(1)}j
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
