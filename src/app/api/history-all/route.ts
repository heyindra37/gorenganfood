import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('daily_logs').select('*').order('log_date')
  return NextResponse.json({ logs: data || [] })
}
