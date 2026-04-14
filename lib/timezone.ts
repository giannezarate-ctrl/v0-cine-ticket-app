export const TIMEZONE = 'America/Sao_Paulo'

export const OPERATING_START_HOUR = 10
export const OPERATING_END_HOUR = 23
export const CLEANING_MARGIN_MINUTES = 15

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatDateLocal(dt: Date): string {
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTimeLocal(dt: Date): string {
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function toTimezoneDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export function formatForPostgres(dateStr: string, timeStr: string): string {
  return `${dateStr} ${timeStr}:00`
}

export function extractTimeInMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}
