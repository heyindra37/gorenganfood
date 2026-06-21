import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, unknown> = {
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ MISSING',
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ set' : '❌ MISSING',
    session_secret: process.env.SESSION_SECRET ? '✅ set' : '⚠️ using fallback',
    node_env: process.env.NODE_ENV,
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('user_settings').select('id, total_xp').eq('id', 1).maybeSingle()
    checks.db_connection = error ? `❌ ${error.message}` : '✅ connected'
    checks.user_settings = data ? `✅ found (xp: ${data.total_xp})` : '❌ no row found — go to /setup'
  } catch (e) {
    checks.db_connection = `❌ exception: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json(checks)
}
