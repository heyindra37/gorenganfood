import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('user_settings')
    .select('hashed_password')
    .eq('id', 1)
    .maybeSingle()

  if (!settings) {
    return NextResponse.json({ error: 'App belum disetup. Buka /setup terlebih dahulu.' }, { status: 404 })
  }

  const valid = await verifyPassword(password, settings.hashed_password)
  if (!valid) return NextResponse.json({ error: 'Password salah' }, { status: 401 })

  await createSession()
  return NextResponse.json({ success: true })
}
