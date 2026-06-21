import { SupabaseClient } from '@supabase/supabase-js'
import { FastingSession } from '@/types'

export async function getActiveFastingSession(supabase: SupabaseClient): Promise<FastingSession | null> {
  const { data } = await supabase
    .from('fasting_sessions')
    .select('*')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  return data as FastingSession | null
}

export async function autoRestartFasting(
  supabase: SupabaseClient,
  activeSessionId: string,
  triggerLogItemId: string,
  restartTime: string
): Promise<FastingSession> {
  // End current session
  const start = await supabase
    .from('fasting_sessions')
    .select('started_at')
    .eq('id', activeSessionId)
    .single()

  const startedAt = start.data?.started_at
  let durationMinutes: number | null = null
  if (startedAt) {
    durationMinutes = Math.floor(
      (new Date(restartTime).getTime() - new Date(startedAt).getTime()) / 60000
    )
  }

  await supabase
    .from('fasting_sessions')
    .update({
      ended_at: restartTime,
      duration_minutes: durationMinutes,
      end_reason: 'auto_restart',
      log_item_trigger_id: triggerLogItemId,
    })
    .eq('id', activeSessionId)

  // Start new session
  const { data: newSession, error } = await supabase
    .from('fasting_sessions')
    .insert({ started_at: restartTime })
    .select()
    .single()

  if (error) throw new Error(`Failed to create new fasting session: ${error.message}`)
  return newSession as FastingSession
}
