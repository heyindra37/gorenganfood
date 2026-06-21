import { DailyLog } from '@/types'
import { differenceInDays, parseISO, startOfDay } from 'date-fns'

export function isCleanDay(log: DailyLog): boolean {
  return log.wajib_count === 0 && log.sebaiknya_count === 0
}

export interface ConsistencyResult {
  pct: number
  cleanDays: number
  totalDays: number
}

export function consistencyPct(dailyLogs: DailyLog[], startDate: string): ConsistencyResult {
  const start = parseISO(startDate)
  const today = startOfDay(new Date())
  const totalDays = differenceInDays(today, start) + 1

  const cleanDays = dailyLogs.filter(l => isCleanDay(l)).length

  const pct = totalDays > 0 ? Math.round((cleanDays / totalDays) * 100) : 0
  return { pct, cleanDays, totalDays }
}

export interface WeeklyConsistency {
  weekStart: string
  cleanDays: number
  totalDays: number
  pct: number
}

export function weeklyConsistency(dailyLogs: DailyLog[], startDate: string): WeeklyConsistency[] {
  const logsByDate = new Map(dailyLogs.map(l => [l.log_date, l]))
  const start = parseISO(startDate)
  const today = startOfDay(new Date())
  const totalDays = differenceInDays(today, start) + 1

  const weeks: WeeklyConsistency[] = []
  let d = new Date(start)

  // find Monday of start week
  const dayOfWeek = d.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  d.setDate(d.getDate() + daysToMonday)

  while (d <= today) {
    const weekStart = d.toISOString().slice(0, 10)
    let clean = 0, total = 0

    for (let i = 0; i < 7; i++) {
      const day = new Date(d)
      day.setDate(day.getDate() + i)
      if (day < start || day > today) continue
      total++
      const dateStr = day.toISOString().slice(0, 10)
      const log = logsByDate.get(dateStr)
      if (log && isCleanDay(log)) clean++
      // days with no log = dirty (not clean)
    }

    if (total > 0) {
      weeks.push({ weekStart, cleanDays: clean, totalDays: total, pct: Math.round((clean / total) * 100) })
    }

    d.setDate(d.getDate() + 7)
  }

  void totalDays
  return weeks
}
