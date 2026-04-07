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
        WHERE s.movie_id = ${movieId} AND (s.start_time > NOW())
        ORDER BY s.start_time
      `
    } else {
      showtimes = await sql`
        SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, r.name as room_name
        FROM showtimes s
        JOIN movies m ON s.movie_id = m.id
        JOIN rooms r ON s.room_id = r.id
        WHERE s.start_time > NOW()
        ORDER BY s.start_time
      `
    }

    // Map start_time to show_date/show_time for compatibility with UI
    const mapped = showtimes.map((s: any) => {
      const dt = s.start_time ? new Date(s.start_time) : null
      return {
        ...s,
        show_date: dt ? dt.toISOString().split('T')[0] : null,
        show_time: dt ? dt.toTimeString().slice(0,5) : null
      }
    })

    console.log('SHOWTIMES:', mapped)

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('ERROR SHOWTIMES:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { movie_id, room_id, show_date, show_time, start_time, price } = body

    // Support either a combined start_time or separate show_date + show_time
    let startTimeValue = start_time
    if (!startTimeValue && show_date && show_time) {
      // Expect show_date like 'YYYY-MM-DD' and show_time like 'HH:MM'
      startTimeValue = new Date(`${show_date}T${show_time}`).toISOString()
    }

    const result = await sql`
      INSERT INTO showtimes (movie_id, room_id, start_time, price)
      VALUES (${movie_id}, ${room_id}, ${startTimeValue}, ${price})
      RETURNING id, movie_id, room_id, start_time, price, created_at
    `

    const created = result[0]
    // Return also compatibility fields
    const createdDt = created?.start_time ? new Date(created.start_time) : null
    const payload = created ? {
      ...created,
      show_date: createdDt ? createdDt.toISOString().split('T')[0] : null,
      show_time: createdDt ? createdDt.toTimeString().slice(0,5) : null
    } : created

    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    console.error('Error creating showtime:', error)
    return NextResponse.json({ error: 'Error creating showtime' }, { status: 500 })
  }
}
