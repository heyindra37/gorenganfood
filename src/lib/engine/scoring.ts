import { LogItem, UserSettings, WeeklyCredits } from '@/types'
import { CreditType } from '@/types'

type PointKey = keyof Pick<UserSettings,
  'pt_walk_10' | 'pt_walk_30' | 'pt_walk_45' |
  'pt_weights_under30' | 'pt_weights_30_60' | 'pt_other_exercise' | 'pt_weigh_in' |
  'pt_flour_wheat' | 'pt_colored_drink' |
  'pt_mie_goreng' | 'pt_mie_rebus' | 'pt_nasi_goreng'
>

const ITEM_TYPE_TO_KEY: Record<string, PointKey> = {
  walk_10:         'pt_walk_10',
  walk_30:         'pt_walk_30',
  walk_45:         'pt_walk_45',
  weights_under30: 'pt_weights_under30',
  weights_30_60:   'pt_weights_30_60',
  other_exercise:  'pt_other_exercise',
  weigh_in:        'pt_weigh_in',
  flour_wheat:     'pt_flour_wheat',
  colored_drink:   'pt_colored_drink',
  mie_goreng:      'pt_mie_goreng',
  mie_rebus:       'pt_mie_rebus',
  nasi_goreng:     'pt_nasi_goreng',
}

export function pointsFor(itemType: string, settings: UserSettings): number {
  const key = ITEM_TYPE_TO_KEY[itemType]
  if (!key) return 0
  return settings[key] as number
}

export interface CreditResult {
  pointsApplied: number
  creditUsed: CreditType | null
}

export function applyCredit(
  category: 'wajib' | 'sebaiknya',
  basePoints: number,
  weeklyCredits: WeeklyCredits,
  settings: UserSettings
): CreditResult {
  if (category === 'sebaiknya') {
    if (weeklyCredits.kredit_used < settings.kredit_limit) {
      return { pointsApplied: 0, creditUsed: 'kredit' }
    }
    return { pointsApplied: basePoints, creditUsed: null }
  }
  // wajib — still deducts points, but credit protects streak
  if (weeklyCredits.darurat_used < settings.darurat_limit) {
    return { pointsApplied: basePoints, creditUsed: 'darurat' }
  }
  return { pointsApplied: basePoints, creditUsed: null }
}

export interface DailyScoreResult {
  dailyScore: number
  xpEarned: number
  isCleanDay: boolean
  wajibCount: number
  sebanyakCount: number
  kreditUsed: number
  daruratUsed: number
}

export function computeDailyScore(items: LogItem[]): DailyScoreResult {
  let dailyScore = 0
  let xpEarned = 0
  let wajibCount = 0
  let sebanyakCount = 0
  let kreditUsed = 0
  let daruratUsed = 0

  for (const item of items) {
    dailyScore += item.points_applied
    if (item.category === 'habit' && item.points_applied > 0) {
      xpEarned += item.points_applied
    }
    if (item.category === 'wajib') wajibCount++
    if (item.category === 'sebaiknya') sebanyakCount++
    if (item.credit_used === 'kredit') kreditUsed++
    if (item.credit_used === 'darurat') daruratUsed++
  }

  const isCleanDay = wajibCount === 0 && sebanyakCount === 0

  return { dailyScore, xpEarned, isCleanDay, wajibCount, sebanyakCount, kreditUsed, daruratUsed }
}
