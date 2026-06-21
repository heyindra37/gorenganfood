import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Check if already set up
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('id', 1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'App sudah disetup sebelumnya' }, { status: 400 })
  }

  const { password, startingWeight, targetWeight, targetDate } = await req.json()

  if (!password || !startingWeight || !targetWeight) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  const hashed = await hashPassword(password)
  const today = new Date().toISOString().slice(0, 10)
  const defaultTargetDate = targetDate || new Date(
    new Date().setMonth(new Date().getMonth() + 6)
  ).toISOString().slice(0, 10)

  const [settingsRes, goalsRes, streakRes, badgesRes] = await Promise.all([
    supabase.from('user_settings').insert({
      id: 1,
      hashed_password: hashed,
    }),
    supabase.from('user_goals').insert({
      id: 1,
      starting_weight_kg: startingWeight,
      target_weight_kg: targetWeight,
      start_date: today,
      target_date: defaultTargetDate,
    }),
    supabase.from('streaks').insert({ id: 1 }),
    supabase.from('badges').upsert([
      { id: 'first_streak', progress_target: 7 },
      { id: 'sebulan_konsisten', progress_target: 30 },
      { id: 'triwulan_disiplin', progress_target: 90 },
      { id: 'anti_gorengan', progress_target: 7 },
      { id: 'bebas_manis_sebulan', progress_target: 30 },
      { id: 'rajin_jalan', progress_target: 20 },
      { id: 'rajin_timbang', progress_target: 8 },
      { id: 'comeback', progress_target: 1 },
      { id: 'centurion', progress_target: 100 },
      { id: 'fasting_pemula', progress_target: 10 },
      { id: '16_8_konsisten', progress_target: 7 },
      { id: 'progress_berat', progress_target: 1 },
      { id: 'goal_tercapai', progress_target: 1 },
    ], { onConflict: 'id', ignoreDuplicates: true }),
  ])

  if (settingsRes.error) {
    return NextResponse.json({ error: settingsRes.error.message }, { status: 500 })
  }
  void goalsRes; void streakRes; void badgesRes

  await createSession()
  return NextResponse.json({ success: true })
}
