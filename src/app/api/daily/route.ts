import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pointsFor, applyCredit, computeDailyScore } from '@/lib/engine/scoring'
import { getOrCreateWeeklyCredits, consumeCredit } from '@/lib/engine/credits'
import { evaluateStreak, shouldResetMonthlyFreeze } from '@/lib/engine/streak'
import { getActiveFastingSession, autoRestartFasting } from '@/lib/engine/fasting'
import { checkAllBadges } from '@/lib/engine/badges'
import { todayStr, currentMonthKey } from '@/lib/utils'
import { UserSettings, Streak, DailyLog, LogItem } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const today = todayStr()

    const [settingsRes, dailyLogRes, logItemsRes, streakRes] = await Promise.all([
      supabase.from('user_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('daily_logs').select('*').eq('log_date', today).maybeSingle(),
      supabase.from('log_items').select('*').eq('log_date', today).order('logged_at'),
      supabase.from('streaks').select('*').eq('id', 1).maybeSingle(),
    ])

    let weeklyCredits = null
    try {
      weeklyCredits = await getOrCreateWeeklyCredits(supabase)
    } catch (e) {
      console.error('weeklyCredits error:', e)
    }

    return NextResponse.json({
      settings: settingsRes.data,
      dailyLog: dailyLogRes.data,
      logItems: logItemsRes.data || [],
      weeklyCredits,
      streak: streakRes.data,
    })
  } catch (e) {
    console.error('GET /api/daily error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { category, item_type, note } = body

    const today = todayStr()

    const { data: settings } = await supabase.from('user_settings').select('*').eq('id', 1).maybeSingle()
    if (!settings) return NextResponse.json({ error: 'Settings not found' }, { status: 404 })

    const s = settings as UserSettings

    if (item_type === 'weigh_in') {
      const { data: weekItems } = await supabase
        .from('log_items')
        .select('id')
        .eq('item_type', 'weigh_in')
        .gte('log_date', getWeekStart())
      if ((weekItems?.length || 0) >= 2) {
        return NextResponse.json({ error: 'Timbang badan sudah 2x minggu ini (maksimum)' }, { status: 400 })
      }
    }

    await supabase.from('daily_logs').upsert(
      { log_date: today },
      { onConflict: 'log_date', ignoreDuplicates: true }
    )

    const weeklyCredits = await getOrCreateWeeklyCredits(supabase)
    let pointsApplied = pointsFor(item_type, s)
    let creditUsed = null

    if (category === 'wajib' || category === 'sebaiknya') {
      const result = applyCredit(category, pointsApplied, weeklyCredits, s)
      pointsApplied = result.pointsApplied
      creditUsed = result.creditUsed
    }

    const { data: logItem, error: liErr } = await supabase
      .from('log_items')
      .insert({ log_date: today, category, item_type, points_applied: pointsApplied, credit_used: creditUsed, note })
      .select()
      .maybeSingle()

    if (liErr) return NextResponse.json({ error: liErr.message }, { status: 500 })

    if (creditUsed) {
      await consumeCredit(supabase, weeklyCredits.id, creditUsed)
    }

    const { data: allItems } = await supabase.from('log_items').select('*').eq('log_date', today)
    const score = computeDailyScore((allItems || []) as LogItem[])

    await supabase.from('daily_logs').update({
      daily_score: score.dailyScore,
      xp_earned: score.xpEarned,
      is_clean_day: score.isCleanDay,
      wajib_count: score.wajibCount,
      sebaiknya_count: score.sebanyakCount,
      kredit_used: score.kreditUsed,
      darurat_used: score.daruratUsed,
      updated_at: new Date().toISOString(),
    }).eq('log_date', today)

    if (category === 'habit' && pointsApplied > 0) {
      await supabase.rpc('increment_xp', { amount: pointsApplied })
    }

    const { data: streakData } = await supabase.from('streaks').select('*').eq('id', 1).maybeSingle()
    let streak = streakData as Streak | null

    if (!streak) {
      await supabase.from('streaks').insert({ id: 1 })
      const { data } = await supabase.from('streaks').select('*').eq('id', 1).maybeSingle()
      streak = data as Streak
    }

    if (streak && shouldResetMonthlyFreeze(streak)) {
      await supabase.from('streaks').update({
        freeze_used_this_month: false,
        freeze_active_date: null,
        freeze_month: currentMonthKey(),
      }).eq('id', 1)
      const { data } = await supabase.from('streaks').select('*').eq('id', 1).maybeSingle()
      streak = data as Streak
    }

    const { data: updatedDailyLog } = await supabase.from('daily_logs').select('*').eq('log_date', today).maybeSingle()

    if (streak && updatedDailyLog) {
      const evalResult = evaluateStreak({ todayLog: updatedDailyLog as DailyLog, streak, settings: s })

      if (evalResult.broke) {
        await supabase.from('streaks').update({
          current_streak: 0,
          last_break_date: today,
          updated_at: new Date().toISOString(),
        }).eq('id', 1)
      } else {
        await supabase.from('streaks').update({
          current_streak: evalResult.newStreak,
          longest_streak: evalResult.longestStreak,
          last_clean_date: today,
          updated_at: new Date().toISOString(),
        }).eq('id', 1)

        if (evalResult.milestoneBonus) {
          await supabase.rpc('increment_xp', { amount: evalResult.milestoneBonus.xp })
          await supabase.from('daily_logs').update({
            daily_score: score.dailyScore + evalResult.milestoneBonus.pts,
          }).eq('log_date', today)
        }
      }
    }

    if (category === 'wajib' || category === 'sebaiknya') {
      const activeSession = await getActiveFastingSession(supabase)
      if (activeSession) {
        await autoRestartFasting(supabase, activeSession.id, logItem.id, logItem.logged_at)
      }
    }

    const [badgesRes, weightLogsRes, fastingSessionsRes, goalsRes, allDailyLogsRes, allLogItemsRes, finalStreakRes] = await Promise.all([
      supabase.from('badges').select('*'),
      supabase.from('weight_logs').select('*'),
      supabase.from('fasting_sessions').select('*'),
      supabase.from('user_goals').select('*').eq('id', 1).maybeSingle(),
      supabase.from('daily_logs').select('*'),
      supabase.from('log_items').select('*'),
      supabase.from('streaks').select('*').eq('id', 1).maybeSingle(),
    ])

    const newBadges = await checkAllBadges(supabase, {
      streak: finalStreakRes.data as Streak,
      dailyLogs: allDailyLogsRes.data || [],
      logItems: allLogItemsRes.data || [],
      weightLogs: weightLogsRes.data || [],
      fastingSessions: fastingSessionsRes.data || [],
      userGoals: goalsRes.data,
      currentBadges: badgesRes.data || [],
    })

    return NextResponse.json({ success: true, newBadges })
  } catch (e) {
    console.error('POST /api/daily error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().slice(0, 10)
}
