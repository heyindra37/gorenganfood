'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { cn, formatDateId } from '@/lib/utils'
import { HABIT_LABELS, VIOLATION_LABELS } from '@/lib/constants'
import type { DailyLog, LogItem } from '@/types'

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, LogItem[]>>({})
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/history-all')
      const json = await res.json()
      if (res.ok) setLogs([...(json.logs || [])].reverse())
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function expandDate(date: string) {
    if (expanded === date) { setExpanded(null); return }
    setExpanded(date)
    if (items[date]) return
    const res = await fetch(`/api/daily/${date}`)
    const json = await res.json()
    setItems(prev => ({ ...prev, [date]: json.logItems || [] }))
  }

  async function deleteItem(date: string, itemId: string) {
    if (!confirm('Hapus log item ini?')) return
    setDeleting(itemId)
    try {
      const res = await fetch(`/api/daily/${date}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      if (res.ok) {
        toast.success('Log dihapus')
        // Recalculate from this date
        await fetch('/api/recalculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromDate: date }),
        })
        // Refresh items
        const r2 = await fetch(`/api/daily/${date}`)
        const j2 = await r2.json()
        setItems(prev => ({ ...prev, [date]: j2.logItems || [] }))
        await fetchData()
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Riwayat</h1>
      <p className="text-gray-400 text-sm">{logs.length} hari dilog</p>

      {logs.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
          Belum ada log. Mulai log dari halaman Daily Log.
        </div>
      )}

      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.log_date} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => expandDate(log.log_date)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0', log.is_clean_day ? 'bg-green-500' : 'bg-red-500')} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{formatDateId(log.log_date)}</div>
                <div className="text-xs text-gray-500">
                  {log.wajib_count > 0 && `${log.wajib_count}× wajib `}
                  {log.sebaiknya_count > 0 && `${log.sebaiknya_count}× sebaiknya`}
                  {log.is_clean_day && 'Hari bersih ✅'}
                </div>
              </div>
              <div className={cn('font-bold text-sm', log.daily_score >= 0 ? 'text-green-400' : 'text-red-400')}>
                {log.daily_score > 0 ? '+' : ''}{log.daily_score}
              </div>
              <div className="text-gray-600">{expanded === log.log_date ? '▲' : '▼'}</div>
            </button>

            {expanded === log.log_date && (
              <div className="border-t border-gray-800 px-4 py-3 space-y-2">
                {(items[log.log_date] || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">Tidak ada log item.</p>
                ) : (
                  (items[log.log_date] || []).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                        item.category === 'habit' ? 'bg-green-900 text-green-300' :
                        item.category === 'wajib' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                      )}>
                        {item.category}
                      </span>
                      <span className="flex-1 text-gray-300">
                        {HABIT_LABELS[item.item_type] || VIOLATION_LABELS[item.item_type]}
                      </span>
                      {item.credit_used && <span className="text-xs text-blue-400">(kredit)</span>}
                      <span className={cn('font-mono text-xs', item.points_applied >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {item.points_applied > 0 ? '+' : ''}{item.points_applied}
                      </span>
                      <button
                        onClick={() => deleteItem(log.log_date, item.id)}
                        disabled={deleting === item.id}
                        className="text-gray-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
