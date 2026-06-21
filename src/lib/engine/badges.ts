import { Badge, DailyLog, FastingSession, LogItem, Streak, UserGoals, WeightLog } from '@/types'
import { SupabaseClient } from '@supabase/supabase-js'

interface BadgeContext {
  streak: Streak
  dailyLogs: DailyLog[]
  logItems: LogItem[]
  weightLogs: WeightLog[]
  fastingSessions: FastingSession[]
  userGoals: UserGoals | null
  currentBadges: Badge[]
}

type BadgeChecker = (ctx: BadgeContext) => { progress: number; unlocked: boolean }

const BADGE_CHECKERS: Record<string, BadgeChecker> = {
  first_streak: ({ streak }) => ({
    progress: Math.min(streak.current_streak, 7),
    unlocked: streak.current_streak >= 7 || streak.longest_streak >= 7,
  }),

  sebulan_konsisten: ({ streak }) => ({
    progress: Math.min(streak.current_streak, 30),
    unlocked: streak.current_streak >= 30 || streak.longest_streak >= 30,
  }),

  triwulan_disiplin: ({ streak }) => ({
    progress: Math.min(streak.current_streak, 90),
    unlocked: streak.current_streak >= 90 || streak.longest_streak >= 90,
  }),

  anti_gorengan: ({ dailyLogs }) => {
    let consecutive = 0
    let best = 0
    for (const log of [...dailyLogs].sort((a, b) => a.log_date.localeCompare(b.log_date))) {
      if (log.wajib_count === 0) {
        consecutive++
        best = Math.max(best, consecutive)
      } else {
        consecutive = 0
      }
    }
    return { progress: Math.min(best, 7), unlocked: best >= 7 }
  },

  bebas_manis_sebulan: ({ logItems, dailyLogs }) => {
    const datesWithColoredDrink = new Set(
      logItems.filter(i => i.item_type === 'colored_drink').map(i => i.log_date)
    )
    let consecutive = 0
    let best = 0
    for (const log of [...dailyLogs].sort((a, b) => a.log_date.localeCompare(b.log_date))) {
      if (!datesWithColoredDrink.has(log.log_date)) {
        consecutive++
        best = Math.max(best, consecutive)
      } else {
        consecutive = 0
      }
    }
    return { progress: Math.min(best, 30), unlocked: best >= 30 }
  },

  rajin_jalan: ({ logItems }) => {
    const datesWithWalk = new Set(
      logItems.filter(i => i.item_type.startsWith('walk_')).map(i => i.log_date)
    )
    return { progress: Math.min(datesWithWalk.size, 20), unlocked: datesWithWalk.size >= 20 }
  },

  rajin_timbang: ({ logItems }) => {
    // Count weeks with ≥2 weigh_ins
    const weekMap = new Map<string, number>()
    for (const item of logItems.filter(i => i.item_type === 'weigh_in')) {
      const d = new Date(item.log_date + 'T00:00:00')
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d.setDate(diff)).toISOString().slice(0, 10)
      weekMap.set(monday, (weekMap.get(monday) || 0) + 1)
    }
    let consecutive = 0
    let best = 0
    const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b))
    for (const [, count] of weeks) {
      if (count >= 2) {
        consecutive++
        best = Math.max(best, consecutive)
      } else {
        consecutive = 0
      }
    }
    return { progress: Math.min(best, 8), unlocked: best >= 8 }
  },

  comeback: ({ streak, dailyLogs }) => {
    const hadBreak = streak.last_break_date !== null || dailyLogs.some(l => l.wajib_count > 0 || l.sebaiknya_count > 0)
    const hasNewStreak = streak.current_streak >= 3
    return { progress: hasNewStreak ? 1 : 0, unlocked: hadBreak && hasNewStreak }
  },

  centurion: ({ dailyLogs }) => {
    const count = dailyLogs.length
    return { progress: Math.min(count, 100), unlocked: count >= 100 }
  },

  fasting_pemula: ({ fastingSessions }) => {
    const completed = fastingSessions.filter(s => s.ended_at !== null).length
    return { progress: Math.min(completed, 10), unlocked: completed >= 10 }
  },

  '16_8_konsisten': ({ fastingSessions }) => {
    const completed = fastingSessions.filter(s => s.ended_at !== null && (s.duration_minutes || 0) >= 960)
    let consecutive = 0
    let best = 0
    const sorted = [...completed].sort((a, b) => a.started_at.localeCompare(b.started_at))
    for (const s of sorted) {
      consecutive++
      best = Math.max(best, consecutive)
    }
    return { progress: Math.min(best, 7), unlocked: best >= 7 }
  },

  progress_berat: ({ weightLogs, userGoals }) => {
    if (!userGoals || weightLogs.length < 1) return { progress: 0, unlocked: false }
    const latest = weightLogs.sort((a, b) => b.log_date.localeCompare(a.log_date))[0]
    const unlocked = latest.weight_kg < userGoals.starting_weight_kg
    return { progress: unlocked ? 1 : 0, unlocked }
  },

  goal_tercapai: ({ weightLogs, userGoals }) => {
    if (!userGoals || weightLogs.length < 1) return { progress: 0, unlocked: false }
    const latest = weightLogs.sort((a, b) => b.log_date.localeCompare(a.log_date))[0]
    const unlocked = latest.weight_kg <= userGoals.target_weight_kg
    return { progress: unlocked ? 1 : 0, unlocked }
  },
}

export async function checkAllBadges(
  supabase: SupabaseClient,
  ctx: BadgeContext
): Promise<string[]> {
  const newlyUnlocked: string[] = []

  for (const [badgeId, checker] of Object.entries(BADGE_CHECKERS)) {
    const existingBadge = ctx.currentBadges.find(b => b.id === badgeId)
    if (existingBadge?.unlocked) continue

    const result = checker(ctx)

    await supabase
      .from('badges')
      .update({ progress_value: result.progress })
      .eq('id', badgeId)

    if (result.unlocked) {
      await supabase
        .from('badges')
        .update({ unlocked: true, unlock_date: new Date().toISOString().slice(0, 10) })
        .eq('id', badgeId)
      newlyUnlocked.push(badgeId)
    }
  }

  return newlyUnlocked
}
