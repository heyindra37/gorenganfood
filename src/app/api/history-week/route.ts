import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWeekStart } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const weekStart = getWeekStart()

  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('log_date', weekStart)
    .order('log_date')

  return NextResponse.json({ logs: data || [] })
}
