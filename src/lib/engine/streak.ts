import { DailyLog, Streak, UserSettings } from '@/types'
import { MILESTONE_BONUSES } from '@/lib/constants'
import { currentMonthKey } from '@/lib/utils'

export interface StreakEvalInput {
  todayLog: DailyLog
  streak: Streak
  settings: UserSettings
}

export interface StreakEvalResult {
  newStreak: number
  longestStreak: number
  broke: boolean
  milestoneBonus: { xp: number; pts: number } | null
}

export function evaluateStreak(input: StreakEvalInput): StreakEvalResult {
  const { todayLog, streak, settings } = input

  // Violations that exceeded the credit protection limits
  const wajibOverLimit = Math.max(0, todayLog.wajib_count - todayLog.darurat_used)
  const sebanyakOverLimit = Math.max(0, todayLog.sebaiknya_count - todayLog.kredit_used)

  const broke = wajibOverLimit > 0 || sebanyakOverLimit > 0
  const isProtectedByFreeze = streak.freeze_active_date === todayLog.log_date

  if (broke && !isProtectedByFreeze) {
    return {
      newStreak: 0,
      longestStreak: streak.longest_streak,
      broke: true,
      milestoneBonus: null,
    }
  }

  const newStreak = streak.current_streak + 1
  const longestStreak = Math.max(streak.longest_streak, newStreak)
  const bonus = MILESTONE_BONUSES[newStreak] || null

  return { newStreak, longestStreak, broke: false, milestoneBonus: bonus }
}

export function shouldResetMonthlyFreeze(streak: Streak): boolean {
  return streak.freeze_month !== currentMonthKey()
}

export function milestoneBonus(streakCount: number): { xp: number; pts: number } | null {
  return MILESTONE_BONUSES[streakCount] || null
}
