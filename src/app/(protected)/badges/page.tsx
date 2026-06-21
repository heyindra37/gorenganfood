'use client'
import { useState, useEffect, useCallback } from 'react'
import { BADGE_DEFS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Badge } from '@/types'

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/badges')
      const json = await res.json()
      if (res.ok) setBadges(json.badges || [])
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const unlocked = badges.filter(b => b.unlocked)
  const locked = badges.filter(b => !b.unlocked)

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Badges</h1>
        <span className="bg-green-900/50 text-green-400 text-sm px-3 py-1 rounded-full border border-green-800">
          {unlocked.length}/{badges.length} unlocked
        </span>
      </div>

      {unlocked.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Unlocked 🏅</h2>
          <div className="grid grid-cols-2 gap-3">
            {unlocked.map(badge => {
              const def = BADGE_DEFS.find(d => d.id === badge.id)
              if (!def) return null
              return (
                <div key={badge.id} className="bg-gray-900 border border-yellow-800/50 rounded-xl p-4">
                  <div className="text-3xl mb-2">{def.icon}</div>
                  <div className="font-semibold text-white text-sm">{def.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{def.description}</div>
                  {badge.unlock_date && (
                    <div className="text-xs text-yellow-600 mt-2">{badge.unlock_date}</div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Belum Unlocked 🔒</h2>
        <div className="grid grid-cols-2 gap-3">
          {locked.map(badge => {
            const def = BADGE_DEFS.find(d => d.id === badge.id)
            if (!def) return null
            const progress = badge.progress_value || 0
            const target = badge.progress_target || 1
            const pct = Math.min(100, Math.round((progress / target) * 100))
            return (
              <div key={badge.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 opacity-60">
                <div className="text-3xl mb-2 grayscale">{def.icon}</div>
                <div className="font-semibold text-gray-300 text-sm">{def.name}</div>
                <div className="text-xs text-gray-500 mt-1">{def.description}</div>
                {target > 1 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}/{target}</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-1.5">
                      <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
