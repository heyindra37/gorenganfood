'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Streak, WeeklyCredits } from '@/types'

export default function StreakPage() {
  const [data, setData] = useState<{ streak: Streak | null; weeklyCredits: WeeklyCredits | null; settings: { kredit_limit: number; darurat_limit: number } | null } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/streak')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function activateFreeze() {
    if (!confirm('Aktifkan streak freeze untuk hari ini?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate_freeze' }),
      })
      const json = await res.json()
      if (!res.ok) toast.error(json.error)
      else {
        toast.success('❄️ Streak freeze diaktifkan!')
        await fetchData()
      }
    } finally {
      setLoading(false)
    }
  }

  if (!data) return <div className="p-6 text-gray-400">Memuat...</div>
  const { streak, weeklyCredits, settings } = data
  const kreditLimit = settings?.kredit_limit || 2
  const daruratLimit = settings?.darurat_limit || 4
  const kreditUsed = weeklyCredits?.kredit_used || 0
  const daruratUsed = weeklyCredits?.darurat_used || 0

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Streak & Kredit</h1>

      {/* Streak counter */}
      <div className="bg-gradient-to-br from-orange-950/50 to-red-950/50 border border-orange-800/50 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-3">🔥</div>
        <div className="text-6xl font-bold text-orange-300 mb-1">{streak?.current_streak || 0}</div>
        <div className="text-orange-400 text-lg">hari berturut-turut</div>
        {streak?.last_clean_date && (
          <div className="text-gray-500 text-sm mt-2">Terakhir bersih: {streak.last_clean_date}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{streak?.longest_streak || 0}</div>
          <div className="text-xs text-gray-400 mt-1">🏆 Streak Terpanjang</div>
        </div>
        {streak?.last_break_date && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-sm font-medium text-gray-300">{streak.last_break_date}</div>
            <div className="text-xs text-gray-400 mt-1">💔 Streak Terakhir Reset</div>
          </div>
        )}
      </div>

      {/* Weekly credits */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-white">Kredit Minggu Ini</h2>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Kredit "Sebaiknya Dihindari"</span>
            <span className={kreditUsed >= kreditLimit ? 'text-red-400 font-bold' : 'text-yellow-400'}>
              {kreditUsed}/{kreditLimit} terpakai
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: kreditLimit }).map((_, i) => (
              <div key={i} className={cn('flex-1 h-4 rounded-full', i < kreditUsed ? 'bg-yellow-600' : 'bg-gray-700')} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Mie goreng/rebus, nasi goreng — gratis jika kredit masih ada (0 poin, tidak putus streak)</p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Jatah Darurat "Wajib Dihindari"</span>
            <span className={daruratUsed >= daruratLimit ? 'text-red-400 font-bold' : 'text-orange-400'}>
              {daruratUsed}/{daruratLimit} terpakai
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: daruratLimit }).map((_, i) => (
              <div key={i} className={cn('flex-1 h-4 rounded-full', i < daruratUsed ? 'bg-red-700' : 'bg-gray-700')} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Tepung/gandum, minuman berwarna — tetap kena poin, tapi tidak putus streak (maks {daruratLimit}x/minggu)</p>
        </div>

        <p className="text-xs text-gray-500 border-t border-gray-800 pt-3">Kredit reset setiap Senin pagi</p>
      </section>

      {/* Freeze */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h2 className="font-semibold text-white mb-3">❄️ Streak Freeze</h2>
        {streak?.freeze_used_this_month ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">🧊</div>
            <p className="text-gray-400 text-sm">
              Freeze sudah dipakai bulan ini
              {streak.freeze_active_date && ` (${streak.freeze_active_date})`}
            </p>
            <p className="text-gray-500 text-xs mt-1">Reset bulan depan</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-3">
              Freeze tersedia. Aktifkan untuk melindungi streak hari ini dari pelanggaran atau hari yang tidak ter-log.
            </p>
            <button
              onClick={activateFreeze}
              disabled={loading}
              className="w-full py-2.5 bg-blue-800 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              ❄️ Aktifkan Freeze Hari Ini
            </button>
          </div>
        )}
      </section>

      {/* Milestone bonuses reference */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h2 className="font-semibold text-white mb-3">🎁 Bonus Milestone Streak</h2>
        <div className="space-y-2">
          {[
            { days: 3, xp: 5, pts: 5 },
            { days: 7, xp: 20, pts: 15 },
            { days: 14, xp: 40, pts: 20 },
            { days: 30, xp: 100, pts: 50 },
            { days: 90, xp: 300, pts: 100 },
          ].map(m => (
            <div key={m.days} className={cn('flex items-center gap-3 py-2 px-3 rounded-xl text-sm', (streak?.current_streak || 0) >= m.days ? 'bg-green-900/20 border border-green-800/50' : 'border border-transparent')}>
              <span className="w-12 font-bold text-white">{m.days}h</span>
              <span className="flex-1 text-gray-400">Streak {m.days} hari</span>
              <span className="text-blue-400">+{m.xp} XP</span>
              <span className="text-green-400">+{m.pts} pts</span>
              {(streak?.current_streak || 0) >= m.days && <span className="text-green-400">✓</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
