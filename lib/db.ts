import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export interface Movie {
  id: number
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
  id: number
  name: string
  rows_count: number
  seats_per_row: number
  total_seats: number
}

export interface Showtime {
  id: number
  movie_id: number
  room_id: number
  show_date: string
  show_time: string
  price: number
  is_active: boolean
  movie_title?: string
  movie_poster?: string
  room_name?: string
}

export interface Ticket {
  id: number
  showtime_id: number
  seat_row: string
  seat_number: number
  ticket_code: string
  customer_name: string
  customer_email: string
  purchase_date: string
  is_validated: boolean
  validated_at: string | null
  movie_title?: string
  show_date?: string
  show_time?: string
  room_name?: string
}
