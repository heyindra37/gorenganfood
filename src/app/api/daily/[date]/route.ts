import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const supabase = await createClient()

  const [dailyLogRes, logItemsRes] = await Promise.all([
    supabase.from('daily_logs').select('*').eq('log_date', date).single(),
    supabase.from('log_items').select('*').eq('log_date', date).order('logged_at'),
  ])

  return NextResponse.json({
    dailyLog: dailyLogRes.data,
    logItems: logItemsRes.data || [],
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const supabase = await createClient()
  const { itemId } = await req.json()

  await supabase.from('log_items').delete().eq('id', itemId).eq('log_date', date)
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const supabase = await createClient()
  const body = await req.json()

  // Ensure daily_log row exists
  await supabase.from('daily_logs').upsert(
    { log_date: date },
    { onConflict: 'log_date', ignoreDuplicates: true }
  )

  const { error } = await supabase.from('log_items').insert({
    log_date: date,
    ...body,
    logged_at: body.logged_at || new Date(date + 'T12:00:00').toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
