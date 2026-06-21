import { BadgeDef, LevelInfo } from '@/types'

export const LEVEL_THRESHOLDS: LevelInfo[] = [
  { level: 1, title: 'Pemula',           floor: 0,     ceiling: 99    },
  { level: 2, title: 'Belajar Disiplin', floor: 100,   ceiling: 299   },
  { level: 3, title: 'Konsisten',        floor: 300,   ceiling: 699   },
  { level: 4, title: 'Disiplin',         floor: 700,   ceiling: 1499  },
  { level: 5, title: 'Master',           floor: 1500,  ceiling: 2999  },
  { level: 6, title: 'Grandmaster',      floor: 3000,  ceiling: 5999  },
  { level: 7, title: 'Legend',           floor: 6000,  ceiling: 9999  },
  { level: 8, title: 'Living Legend',    floor: 10000, ceiling: Infinity },
]

export const MILESTONE_BONUSES: Record<number, { xp: number; pts: number }> = {
  3:  { xp: 5,   pts: 5   },
  7:  { xp: 20,  pts: 15  },
  14: { xp: 40,  pts: 20  },
  30: { xp: 100, pts: 50  },
  90: { xp: 300, pts: 100 },
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_streak',        name: 'First Streak',          icon: '🎯', description: 'Raih streak 7 hari pertama kali' },
  { id: 'sebulan_konsisten',   name: 'Sebulan Konsisten',     icon: '🔥', description: 'Streak 30 hari berturut-turut' },
  { id: 'triwulan_disiplin',   name: 'Triwulan Disiplin',     icon: '👑', description: 'Streak 90 hari berturut-turut' },
  { id: 'anti_gorengan',       name: 'Anti Gorengan',         icon: '🚫', description: '7 hari berturut tanpa pelanggaran wajib' },
  { id: 'bebas_manis_sebulan', name: 'Bebas Manis Sebulan',   icon: '💧', description: '30 hari tanpa minuman berwarna' },
  { id: 'rajin_jalan',         name: 'Rajin Jalan',           icon: '🚶', description: '20 hari ada log jalan kaki' },
  { id: 'rajin_timbang',       name: 'Rajin Timbang',         icon: '⚖️', description: '8 minggu berturut nimbang 2x/minggu' },
  { id: 'comeback',            name: 'Comeback',              icon: '💪', description: 'Bangun streak baru 7 hari setelah streak reset' },
  { id: 'centurion',           name: 'Centurion',             icon: '💯', description: 'Total 100 hari log (kumulatif)' },
  { id: 'fasting_pemula',      name: 'Fasting Pemula',        icon: '⏱️', description: '10 sesi fasting selesai' },
  { id: '16_8_konsisten',      name: '16:8 Konsisten',        icon: '🌙', description: '7 hari fasting ≥16 jam berturut' },
  { id: 'progress_berat',      name: 'Progress Berat',        icon: '📉', description: 'Sudah turun berat badan dari awal' },
  { id: 'goal_tercapai',       name: 'Goal Tercapai',         icon: '🏆', description: 'Berat badan ideal tercapai' },
]

export const HABIT_LABELS: Record<string, string> = {
  walk_10:         'Jalan Kaki 10 Menit',
  walk_30:         'Jalan Kaki 30 Menit',
  walk_45:         'Jalan Kaki 45–60 Menit',
  weights_under30: 'Angkat Beban <30 Menit',
  weights_30_60:   'Angkat Beban 30–60 Menit',
  other_exercise:  'Olahraga Lain',
  weigh_in:        'Timbang Berat Badan',
}

export const VIOLATION_LABELS: Record<string, string> = {
  flour_wheat:   'Produk Tepung/Gandum',
  colored_drink: 'Minuman Berwarna',
  mie_goreng:    'Mie Goreng',
  mie_rebus:     'Mie Rebus',
  nasi_goreng:   'Nasi Goreng',
}
