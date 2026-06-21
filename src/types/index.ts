export type CreditType = 'kredit' | 'darurat'
export type FastingEndReason = 'manual' | 'auto_restart'

export interface UserSettings {
  id: number
  hashed_password: string
  pt_walk_10: number
  pt_walk_30: number
  pt_walk_45: number
  pt_weights_under30: number
  pt_weights_30_60: number
  pt_other_exercise: number
  pt_weigh_in: number
  pt_flour_wheat: number
  pt_colored_drink: number
  pt_mie_goreng: number
  pt_mie_rebus: number
  pt_nasi_goreng: number
  kredit_limit: number
  darurat_limit: number
  total_xp: number
  updated_at: string
}

export interface UserGoals {
  id: number
  starting_weight_kg: number
  target_weight_kg: number
  start_date: string
  target_date: string | null
}

export interface DailyLog {
  id: string
  log_date: string
  daily_score: number
  xp_earned: number
  is_clean_day: boolean
  wajib_count: number
  sebaiknya_count: number
  kredit_used: number
  darurat_used: number
  created_at: string
  updated_at: string
}

export interface LogItem {
  id: string
  log_date: string
  category: 'habit' | 'wajib' | 'sebaiknya'
  item_type: string
  points_applied: number
  credit_used: CreditType | null
  logged_at: string
  note: string | null
}

export interface Streak {
  id: number
  current_streak: number
  longest_streak: number
  last_clean_date: string | null
  last_break_date: string | null
  freeze_used_this_month: boolean
  freeze_active_date: string | null
  freeze_month: string | null
  updated_at: string
}

export interface WeeklyCredits {
  id: string
  week_start: string
  kredit_used: number
  darurat_used: number
  created_at: string
}

export interface WeightLog {
  id: string
  log_date: string
  weight_kg: number
  created_at: string
}

export interface FastingSession {
  id: string
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  end_reason: FastingEndReason | null
  log_item_trigger_id: string | null
  created_at: string
}

export interface Badge {
  id: string
  unlocked: boolean
  unlock_date: string | null
  progress_value: number | null
  progress_target: number | null
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string
}

export interface LevelInfo {
  level: number
  title: string
  floor: number
  ceiling: number
}
