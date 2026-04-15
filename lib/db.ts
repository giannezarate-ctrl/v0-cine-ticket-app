import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL!
export const sql = neon(databaseUrl)

export async function setTimezone() {
  await sql`SET TimeZone = 'America/Bogota'`
}

export interface Movie {
  id: string
  title: string
  genre: string
  duration: number
  rating: string
  synopsis: string
  poster_url: string
  trailer_url: string | null
  release_date: string
  is_active: boolean
  created_at: string
}

export interface Room {
  id: string
  name: string
  capacity: number
  created_at: string
  seats?: Seat[]
  rows_count?: number
  seats_per_row?: number
  total_seats?: number
}

export interface Seat {
  id: string
  room_id: string
  row: string
  number: number
  created_at: string
}

export interface Showtime {
  id: string
  movie_id: string
  room_id: string
  show_date: string
  show_time: string
  price: number
  is_active: boolean
  created_at: string
  movie_title?: string
  movie_poster?: string
  room_name?: string
  rows_count?: number
  seats_per_row?: number
}

export interface Ticket {
  id: string
  user_id: string | null
  showtime_id: string
  code: string
  total: number
  status: 'active' | 'used' | 'cancelled'
  created_at: string
  validated_at?: string
  movie_title?: string
  show_time?: string
  room_name?: string
  ticket_code?: string
  customer_name?: string
  seat_row?: string
  seat_number?: number
  is_validated?: boolean
  show_date?: string
}
