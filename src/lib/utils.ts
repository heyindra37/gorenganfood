import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { startOfWeek, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWeekStart(date: Date = new Date()): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  return format(monday, 'yyyy-MM-dd')
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}j ${m}m`
}

export function formatDurationSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function currentMonthKey(): string {
  return format(new Date(), 'yyyy-MM')
}

export function formatDateId(dateStr: string): string {
  return format(new Date(dateStr + 'T00:00:00'), 'd MMM yyyy', { locale: localeId })
}
