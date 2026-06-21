import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { end_reason } = await req.json()

  const { data: session } = await supabase.from('fasting_sessions').select('started_at').eq('id', id).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const durationMinutes = Math.floor(
    (Date.now() - new Date(session.started_at).getTime()) / 60000
  )

  await supabase.from('fasting_sessions').update({
    ended_at: new Date().toISOString(),
    duration_minutes: durationMinutes,
    end_reason: end_reason || 'manual',
  }).eq('id', id)

  return NextResponse.json({ success: true, durationMinutes })
}
