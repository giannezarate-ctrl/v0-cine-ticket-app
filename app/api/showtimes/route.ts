import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')
    
    let showtimes
    
    if (movieId) {
      showtimes = await sql`
        SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, r.name as room_name
        FROM showtimes s
        JOIN movies m ON s.movie_id = m.id
        JOIN rooms r ON s.room_id = r.id
        WHERE s.movie_id = ${movieId} AND s.is_active = true AND s.show_date >= CURRENT_DATE
        ORDER BY s.show_date, s.show_time
      `
    } else {
      showtimes = await sql`
        SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, r.name as room_name
        FROM showtimes s
        JOIN movies m ON s.movie_id = m.id
        JOIN rooms r ON s.room_id = r.id
        WHERE s.is_active = true AND s.show_date >= CURRENT_DATE
        ORDER BY s.show_date, s.show_time
      `
    }
    
    return NextResponse.json(showtimes)
  } catch (error) {
    console.error('Error fetching showtimes:', error)
    return NextResponse.json({ error: 'Error fetching showtimes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { movie_id, room_id, show_date, show_time, price } = body
    
    const result = await sql`
      INSERT INTO showtimes (movie_id, room_id, show_date, show_time, price)
      VALUES (${movie_id}, ${room_id}, ${show_date}, ${show_time}, ${price})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating showtime:', error)
    return NextResponse.json({ error: 'Error creating showtime' }, { status: 500 })
  }
}
