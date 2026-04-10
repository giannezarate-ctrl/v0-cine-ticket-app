import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')
    let showtimes

    if (movieId) {
      showtimes = await sql`
        SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, r.name as room_name, r.capacity,
        COALESCE((
          SELECT COUNT(*) 
          FROM showtime_seats ss 
          WHERE ss.showtime_id = s.id AND ss.status = 'available'
        ), 0) as available_seats
        FROM showtimes s
        JOIN movies m ON s.movie_id = m.id
        JOIN rooms r ON s.room_id = r.id
        WHERE s.movie_id = ${movieId} AND s.start_time > NOW()
        ORDER BY s.start_time
      `
    } else {
      showtimes = await sql`
        SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, r.name as room_name, r.capacity,
        COALESCE((
          SELECT COUNT(*) 
          FROM showtime_seats ss 
          WHERE ss.showtime_id = s.id AND ss.status = 'available'
        ), 0) as available_seats
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
        show_time: dt ? dt.toTimeString().slice(0,5) : null,
        rows_count: 10,
        seats_per_row: Math.ceil((s.capacity || 0) / 10)
      }
    }).filter((s: any) => s.available_seats > 0)

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

    if (!movie_id || !room_id) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    let startTimeValue = start_time
    if (!startTimeValue && show_date && show_time) {
      startTimeValue = new Date(`${show_date}T${show_time}`).toISOString()
    }

    if (!startTimeValue) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO showtimes (movie_id, room_id, start_time, price)
      VALUES (${movie_id}, ${room_id}, ${startTimeValue}, ${price})
      RETURNING id, movie_id, room_id, start_time, price, created_at
    `

    const showtimeId = result[0].id

    // Initialize seats for this showtime
    await sql`
      INSERT INTO showtime_seats (showtime_id, seat_id, status)
      SELECT ${showtimeId}, id, 'available'
      FROM seats
      WHERE room_id = ${room_id}
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
