import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL!
export const sql = neon(databaseUrl)

export async function setTimezone() {
  await sql`SET TimeZone = 'America/Bogota'`
}

const TIMEZONE = 'America/Bogota'

export function toLocalDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

export function toLocalTimeString(date: Date): string {
  return date.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false })
}

export function getLocalNow(): Date {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
}

export function parseLocalTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/(\d{2}):(\d{2})/)
  if (match) {
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) }
  }
  return null
}

export function timeToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
