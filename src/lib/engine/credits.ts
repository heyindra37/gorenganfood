import { WeeklyCredits } from '@/types'
import { getWeekStart } from '@/lib/utils'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getOrCreateWeeklyCredits(supabase: SupabaseClient): Promise<WeeklyCredits> {
  const weekStart = getWeekStart()

  const { data: existing } = await supabase
    .from('weekly_credits')
    .select('*')
    .eq('week_start', weekStart)
    .single()

  if (existing) return existing as WeeklyCredits

  const { data: created, error } = await supabase
    .from('weekly_credits')
    .insert({ week_start: weekStart, kredit_used: 0, darurat_used: 0 })
    .select()
    .single()

  if (error) throw new Error(`Failed to create weekly_credits: ${error.message}`)
  return created as WeeklyCredits
}

export async function consumeCredit(
  supabase: SupabaseClient,
  weeklyCreditsId: string,
  type: 'kredit' | 'darurat'
): Promise<void> {
  const field = type === 'kredit' ? 'kredit_used' : 'darurat_used'

  const { data: current } = await supabase
    .from('weekly_credits')
    .select('kredit_used, darurat_used')
    .eq('id', weeklyCreditsId)
    .single()

  if (!current) return

  const currentVal = (current as Record<string, number>)[field] || 0
  await supabase
    .from('weekly_credits')
    .update({ [field]: currentVal + 1 })
    .eq('id', weeklyCreditsId)
}
