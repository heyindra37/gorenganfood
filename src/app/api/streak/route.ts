import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { shouldResetMonthlyFreeze } from '@/lib/engine/streak'
import { currentMonthKey, todayStr } from '@/lib/utils'
import { Streak } from '@/types'
import { getOrCreateWeeklyCredits } from '@/lib/engine/credits'

export async function GET() {
  try {
    const supabase = await createClient()

    const [streakRes, settingsRes] = await Promise.all([
      supabase.from('streaks').select('*').eq('id', 1).single(),
      supabase.from('user_settings').select('kredit_limit, darurat_limit').eq('id', 1).single(),
    ])

    let weeklyCredits = null
    try {
      weeklyCredits = await getOrCreateWeeklyCredits(supabase)
    } catch (e) {
      console.error('weeklyCredits error:', e)
    }

    let streak = streakRes.data as Streak | null
    if (streak && shouldResetMonthlyFreeze(streak)) {
      await supabase.from('streaks').update({
        freeze_used_this_month: false,
        freeze_active_date: null,
        freeze_month: currentMonthKey(),
      }).eq('id', 1)
      const { data } = await supabase.from('streaks').select('*').eq('id', 1).single()
      streak = data as Streak
    }

    return NextResponse.json({
      streak,
      weeklyCredits,
      settings: settingsRes.data,
    })
  } catch (e) {
    console.error('GET /api/streak error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { action } = await req.json()

    if (action === 'activate_freeze') {
      const { data: streak } = await supabase.from('streaks').select('*').eq('id', 1).single()
      const s = streak as Streak
      if (s?.freeze_used_this_month) {
        return NextResponse.json({ error: 'Freeze sudah dipakai bulan ini' }, { status: 400 })
      }
      await supabase.from('streaks').update({
        freeze_used_this_month: true,
        freeze_active_date: todayStr(),
        freeze_month: currentMonthKey(),
      }).eq('id', 1)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
