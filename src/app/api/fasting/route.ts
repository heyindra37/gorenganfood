import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const [activeRes, historyRes] = await Promise.all([
      supabase.from('fasting_sessions').select('*').is('ended_at', null).order('started_at', { ascending: false }).limit(1).single(),
      supabase.from('fasting_sessions').select('*').not('ended_at', 'is', null).order('started_at', { ascending: false }).limit(30),
    ])
    return NextResponse.json({ active: activeRes.data, history: historyRes.data || [] })
  } catch (e) {
    return NextResponse.json({ active: null, history: [], error: String(e) })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: active } = await supabase
      .from('fasting_sessions')
      .select('*')
      .is('ended_at', null)
      .single()

    if (active) {
      const durationMinutes = Math.floor(
        (Date.now() - new Date(active.started_at).getTime()) / 60000
      )
      await supabase.from('fasting_sessions').update({
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        end_reason: 'manual',
      }).eq('id', active.id)
      return NextResponse.json({ stopped: true, durationMinutes })
    }

    const { data, error } = await supabase
      .from('fasting_sessions')
      .insert({ started_at: new Date().toISOString() })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ started: true, session: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
