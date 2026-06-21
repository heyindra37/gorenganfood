import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('badges').select('*').order('id')
  return NextResponse.json({ badges: data || [] })
}
