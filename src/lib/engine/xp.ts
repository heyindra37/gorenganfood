import { LEVEL_THRESHOLDS } from '@/lib/constants'
import { LevelInfo } from '@/types'

export function levelFor(totalXp: number): LevelInfo {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].floor) {
      return LEVEL_THRESHOLDS[i]
    }
  }
  return LEVEL_THRESHOLDS[0]
}

export function levelProgress(totalXp: number): { pct: number; xpInLevel: number; xpNeeded: number } {
  const level = levelFor(totalXp)
  if (level.ceiling === Infinity) return { pct: 100, xpInLevel: totalXp - level.floor, xpNeeded: 0 }
  const xpInLevel = totalXp - level.floor
  const xpNeeded = level.ceiling - level.floor + 1
  return { pct: Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)), xpInLevel, xpNeeded }
}
