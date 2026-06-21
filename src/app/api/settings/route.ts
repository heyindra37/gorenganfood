import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPassword, hashPassword } from '@/lib/auth/password'

export async function GET() {
  const supabase = await createClient()
  const [settingsRes, goalsRes] = await Promise.all([
    supabase.from('user_settings').select('*').eq('id', 1).single(),
    supabase.from('user_goals').select('*').eq('id', 1).single(),
  ])
  return NextResponse.json({ settings: settingsRes.data, goals: goalsRes.data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { old_password, new_password, goals, ...settingsUpdate } = body

  // Password change
  if (old_password && new_password) {
    const { data } = await supabase.from('user_settings').select('hashed_password').eq('id', 1).single()
    if (!data) return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    const valid = await verifyPassword(old_password, data.hashed_password)
    if (!valid) return NextResponse.json({ error: 'Password lama salah' }, { status: 401 })
    settingsUpdate.hashed_password = await hashPassword(new_password)
  }

  if (Object.keys(settingsUpdate).length > 0) {
    settingsUpdate.updated_at = new Date().toISOString()
    await supabase.from('user_settings').update(settingsUpdate).eq('id', 1)
  }

  if (goals) {
    await supabase.from('user_goals').upsert({ id: 1, ...goals }, { onConflict: 'id' })
  }

  return NextResponse.json({ success: true })
}
