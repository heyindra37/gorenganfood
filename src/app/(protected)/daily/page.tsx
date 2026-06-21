'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { cn, formatDateId } from '@/lib/utils'
import { HABIT_LABELS, VIOLATION_LABELS, BADGE_DEFS } from '@/lib/constants'
import type { DailyLog, LogItem, WeeklyCredits, Streak, UserSettings } from '@/types'

interface DailyData {
  settings: UserSettings | null
  dailyLog: DailyLog | null
  logItems: LogItem[]
  weeklyCredits: WeeklyCredits | null
  streak: Streak | null
}

const WAJIB_ITEMS = ['flour_wheat', 'colored_drink']
const SEBAIKNYA_ITEMS = ['mie_goreng', 'mie_rebus', 'nasi_goreng']
const HABIT_ITEMS = ['walk_10', 'walk_30', 'walk_45', 'weights_under30', 'weights_30_60', 'other_exercise', 'weigh_in']

export default function DailyPage() {
  const [data, setData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/daily')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function logItem(category: 'habit' | 'wajib' | 'sebaiknya', item_type: string) {
    setLogging(item_type)
    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, item_type }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Gagal log item')
      } else {
        toast.success(`✅ ${HABIT_LABELS[item_type] || VIOLATION_LABELS[item_type]} dicatat!`)
        if (json.newBadges?.length > 0) {
          for (const badgeId of json.newBadges) {
            const badge = BADGE_DEFS.find(b => b.id === badgeId)
            if (badge) toast.success(`🏅 Badge baru: ${badge.icon} ${badge.name}!`, { duration: 5000 })
          }
        }
        await fetchData()
      }
    } finally {
      setLogging(null)
    }
  }

  if (loading) return <PageSkeleton />

  const { dailyLog, logItems, weeklyCredits, streak, settings } = data || {}
  const today = new Date().toISOString().slice(0, 10)
  const kreditRemain = (settings?.kredit_limit || 2) - (weeklyCredits?.kredit_used || 0)
  const daruratRemain = (settings?.darurat_limit || 4) - (weeklyCredits?.darurat_used || 0)

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Log</h1>
          <p className="text-gray-400 text-sm">{formatDateId(today)}</p>
        </div>
        {streak && (
          <div className="flex items-center gap-2 bg-orange-900/40 border border-orange-800 rounded-xl px-4 py-2">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-orange-300 text-lg">{streak.current_streak}</span>
            <span className="text-orange-400 text-sm">hari</span>
          </div>
        )}
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard label="Skor Hari Ini" value={dailyLog?.daily_score || 0} colorClass={
          (dailyLog?.daily_score || 0) >= 0 ? 'text-green-400' : 'text-red-400'
        } />
        <ScoreCard label="XP Hari Ini" value={`+${dailyLog?.xp_earned || 0}`} colorClass="text-blue-400" />
        <ScoreCard
          label="Status"
          value={dailyLog?.is_clean_day !== false ? '✅ Bersih' : '❌ Melanggar'}
          colorClass={dailyLog?.is_clean_day !== false ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      {/* Kebiasaan Baik */}
      <section className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <span>💪</span> Kebiasaan Baik
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {HABIT_ITEMS.map(item => {
            const count = logItems?.filter(l => l.item_type === item).length || 0
            return (
              <button
                key={item}
                onClick={() => logItem('habit', item)}
                disabled={logging === item}
                className="flex items-center justify-between px-3 py-2.5 bg-gray-800 hover:bg-green-900/40 border border-gray-700 hover:border-green-700 rounded-xl text-sm transition-colors text-left"
              >
                <span className="text-gray-200">{HABIT_LABELS[item]}</span>
                {count > 0 && (
                  <span className="bg-green-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Pelanggaran Wajib Dihindari */}
      <section className="bg-gray-900 rounded-2xl p-4 border border-red-900/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>🚫</span> Wajib Dihindari
          </h2>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">Jatah darurat:</span>
            <span className={cn('font-bold', daruratRemain > 0 ? 'text-yellow-400' : 'text-red-400')}>
              {daruratRemain}/{settings?.darurat_limit || 4}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">Tiap klik: −10 poin, tapi tidak putus streak selama jatah darurat masih ada</p>
        <div className="grid grid-cols-2 gap-2">
          {WAJIB_ITEMS.map(item => {
            const count = logItems?.filter(l => l.item_type === item).length || 0
            return (
              <button
                key={item}
                onClick={() => {
                  if (!confirm(`Catat pelanggaran: ${VIOLATION_LABELS[item]}?`)) return
                  logItem('wajib', item)
                }}
                disabled={logging === item}
                className="flex items-center justify-between px-3 py-2.5 bg-red-950/30 hover:bg-red-900/40 border border-red-900 hover:border-red-700 rounded-xl text-sm transition-colors text-left"
              >
                <span className="text-red-200">{VIOLATION_LABELS[item]}</span>
                {count > 0 && (
                  <span className="bg-red-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Pelanggaran Sebaiknya Dihindari */}
      <section className="bg-gray-900 rounded-2xl p-4 border border-yellow-900/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>⚠️</span> Sebaiknya Dihindari
          </h2>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">Kredit:</span>
            <span className={cn('font-bold', kreditRemain > 0 ? 'text-yellow-400' : 'text-red-400')}>
              {kreditRemain}/{settings?.kredit_limit || 2}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">Selama kredit tersedia: 0 poin dan tidak putus streak</p>
        <div className="grid grid-cols-3 gap-2">
          {SEBAIKNYA_ITEMS.map(item => {
            const count = logItems?.filter(l => l.item_type === item).length || 0
            return (
              <button
                key={item}
                onClick={() => {
                  if (!confirm(`Catat: ${VIOLATION_LABELS[item]}?`)) return
                  logItem('sebaiknya', item)
                }}
                disabled={logging === item}
                className="flex items-center justify-between px-3 py-2.5 bg-yellow-950/20 hover:bg-yellow-900/30 border border-yellow-900/50 hover:border-yellow-700 rounded-xl text-sm transition-colors text-left"
              >
                <span className="text-yellow-200">{VIOLATION_LABELS[item]}</span>
                {count > 0 && (
                  <span className="bg-yellow-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Today's log items */}
      {logItems && logItems.length > 0 && (
        <section className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h2 className="font-semibold text-white mb-3">Log Hari Ini</h2>
          <div className="space-y-2">
            {logItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    item.category === 'habit' ? 'bg-green-900 text-green-300' :
                    item.category === 'wajib' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                  )}>
                    {item.category}
                  </span>
                  <span className="text-gray-300">{HABIT_LABELS[item.item_type] || VIOLATION_LABELS[item.item_type]}</span>
                  {item.credit_used && <span className="text-xs text-blue-400">(kredit)</span>}
                </div>
                <span className={cn('font-mono font-medium', item.points_applied >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {item.points_applied > 0 ? '+' : ''}{item.points_applied}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ScoreCard({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
      <div className={cn('text-xl font-bold', colorClass)}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-gray-900 rounded-2xl h-32 animate-pulse border border-gray-800" />
      ))}
    </div>
  )
}
