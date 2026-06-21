-- ============================================================
-- Diet Discipline Tracker — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ENUMS
CREATE TYPE credit_type AS ENUM ('kredit', 'darurat');
CREATE TYPE fasting_end_reason AS ENUM ('manual', 'auto_restart');

-- user_settings (single row)
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hashed_password TEXT NOT NULL,
  pt_walk_10 INTEGER NOT NULL DEFAULT 2,
  pt_walk_30 INTEGER NOT NULL DEFAULT 5,
  pt_walk_45 INTEGER NOT NULL DEFAULT 8,
  pt_weights_under30 INTEGER NOT NULL DEFAULT 5,
  pt_weights_30_60 INTEGER NOT NULL DEFAULT 8,
  pt_other_exercise INTEGER NOT NULL DEFAULT 5,
  pt_weigh_in INTEGER NOT NULL DEFAULT 3,
  pt_flour_wheat INTEGER NOT NULL DEFAULT -10,
  pt_colored_drink INTEGER NOT NULL DEFAULT -10,
  pt_mie_goreng INTEGER NOT NULL DEFAULT -5,
  pt_mie_rebus INTEGER NOT NULL DEFAULT -5,
  pt_nasi_goreng INTEGER NOT NULL DEFAULT -5,
  kredit_limit INTEGER NOT NULL DEFAULT 2,
  darurat_limit INTEGER NOT NULL DEFAULT 4,
  total_xp INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_goals (single row)
CREATE TABLE user_goals (
  id INTEGER PRIMARY KEY DEFAULT 1,
  starting_weight_kg NUMERIC(5,2) NOT NULL,
  target_weight_kg NUMERIC(5,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE
);

-- daily_logs (one row per calendar date)
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL UNIQUE,
  daily_score INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  is_clean_day BOOLEAN NOT NULL DEFAULT TRUE,
  wajib_count INTEGER NOT NULL DEFAULT 0,
  sebaiknya_count INTEGER NOT NULL DEFAULT 0,
  kredit_used INTEGER NOT NULL DEFAULT 0,
  darurat_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- log_items (each individual event)
CREATE TABLE log_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL REFERENCES daily_logs(log_date) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('habit', 'wajib', 'sebaiknya')),
  item_type TEXT NOT NULL,
  points_applied INTEGER NOT NULL,
  credit_used credit_type,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE INDEX idx_log_items_date ON log_items(log_date);
CREATE INDEX idx_log_items_type ON log_items(item_type);

-- streaks (single row)
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_clean_date DATE,
  last_break_date DATE,
  freeze_used_this_month BOOLEAN NOT NULL DEFAULT FALSE,
  freeze_active_date DATE,
  freeze_month TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- weekly_credits (one row per week)
CREATE TABLE weekly_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  kredit_used INTEGER NOT NULL DEFAULT 0,
  darurat_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- weight_logs
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL UNIQUE,
  weight_kg NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fasting_sessions
CREATE TABLE fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  end_reason fasting_end_reason,
  log_item_trigger_id UUID REFERENCES log_items(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- badges (pre-seeded)
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlock_date DATE,
  progress_value NUMERIC,
  progress_target NUMERIC
);

INSERT INTO badges (id, progress_target) VALUES
  ('first_streak', 7),
  ('sebulan_konsisten', 30),
  ('triwulan_disiplin', 90),
  ('anti_gorengan', 7),
  ('bebas_manis_sebulan', 30),
  ('rajin_jalan', 20),
  ('rajin_timbang', 8),
  ('comeback', 1),
  ('centurion', 100),
  ('fasting_pemula', 10),
  ('16_8_konsisten', 7),
  ('progress_berat', 1),
  ('goal_tercapai', 1);

-- ============================================================
-- RPC: increment XP atomically
-- ============================================================
CREATE OR REPLACE FUNCTION increment_xp(amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE user_settings SET total_xp = total_xp + amount WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Row Level Security (disable for single-user app via API routes)
-- ============================================================
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
