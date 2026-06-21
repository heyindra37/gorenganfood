import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeDailyScore } from '@/lib/engine/scoring'
import { evaluateStreak, shouldResetMonthlyFreeze } from '@/lib/engine/streak'
import { currentMonthKey } from '@/lib/utils'
import { LogItem, Streak, UserSettings, DailyLog } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { fromDate } = await req.json()

  const { data: settings } = await supabase.from('user_settings').select('*').eq('id', 1).maybeSingle()
  if (!settings) return NextResponse.json({ error: 'Settings not found' }, { status: 500 })

  // Get all log_items from fromDate onwards (source of truth)
  const { data: allItems } = await supabase
    .from('log_items')
    .select('*')
    .gte('log_date', fromDate)
    .order('log_date')

  if (!allItems) return NextResponse.json({ success: true })

  // Group by date
  const byDate = new Map<string, LogItem[]>()
  for (const item of allItems as LogItem[]) {
    if (!byDate.has(item.log_date)) byDate.set(item.log_date, [])
    byDate.get(item.log_date)!.push(item)
  }

  // Recompute daily_logs for each affected date
  let totalXpFromDate = 0
  for (const [date, items] of Array.from(byDate)) {
    const score = computeDailyScore(items)
    totalXpFromDate += score.xpEarned
    await supabase.from('daily_logs').upsert({
      log_date: date,
      daily_score: score.dailyScore,
      xp_earned: score.xpEarned,
      is_clean_day: score.isCleanDay,
      wajib_count: score.wajibCount,
      sebaiknya_count: score.sebanyakCount,
      kredit_used: score.kreditUsed,
      darurat_used: score.daruratUsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'log_date' })
  }

  // Recompute total XP from scratch
  const { data: allDailyLogs } = await supabase.from('daily_logs').select('xp_earned')
  const totalXp = (allDailyLogs || []).reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  await supabase.from('user_settings').update({ total_xp: totalXp }).eq('id', 1)

  // Recompute streaks from scratch
  const { data: streakData } = await supabase.from('streaks').select('*').eq('id', 1).maybeSingle()
  let streak = streakData as Streak

  if (streak && shouldResetMonthlyFreeze(streak)) {
    await supabase.from('streaks').update({
      freeze_used_this_month: false,
      freeze_active_date: null,
      freeze_month: currentMonthKey(),
    }).eq('id', 1)
    const { data } = await supabase.from('streaks').select('*').eq('id', 1).maybeSingle()
    streak = data as Streak
  }

  // Replay streak day by day
  const { data: allLogsForStreak } = await supabase
    .from('daily_logs')
    .select('*')
    .order('log_date')

  let currentStreak = 0
  let longestStreak = streak?.longest_streak || 0
  let lastBreakDate: string | null = streak?.last_break_date || null

  for (const log of (allLogsForStreak || []) as DailyLog[]) {
    const evalResult = evaluateStreak({
      todayLog: log,
      streak: { ...streak, current_streak: currentStreak, longest_streak: longestStreak },
      settings: settings as UserSettings,
    })

    if (evalResult.broke) {
      currentStreak = 0
      lastBreakDate = log.log_date
    } else {
      currentStreak = evalResult.newStreak
      longestStreak = evalResult.longestStreak
    }
  }

  await supabase.from('streaks').update({
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_break_date: lastBreakDate,
    updated_at: new Date().toISOString(),
  }).eq('id', 1)

  void totalXpFromDate

  return NextResponse.json({ success: true })
}
