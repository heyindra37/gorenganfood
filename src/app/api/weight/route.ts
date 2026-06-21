import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const [logsRes, goalsRes] = await Promise.all([
    supabase.from('weight_logs').select('*').order('log_date'),
    supabase.from('user_goals').select('*').eq('id', 1).single(),
  ])
  return NextResponse.json({ logs: logsRes.data || [], goals: goalsRes.data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { weight_kg, log_date } = await req.json()

  const { error } = await supabase.from('weight_logs').upsert(
    { log_date: log_date || new Date().toISOString().slice(0, 10), weight_kg },
    { onConflict: 'log_date' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
