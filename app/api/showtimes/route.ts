import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function formatDateLocal(dt: Date) {
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimeLocal(dt: Date) {
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

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
        WHERE s.movie_id = ${movieId}
        ORDER BY s.start_time ASC
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
        ORDER BY s.start_time DESC
      `
    }

    const mapped = showtimes.map((s: any) => {
      const dt = s.start_time ? new Date(s.start_time) : null
      const et = s.end_time ? new Date(s.end_time) : null
      return {
        ...s,
        show_date: dt ? formatDateLocal(dt) : null,
        show_time: dt ? formatTimeLocal(dt) : null,
        end_time_display: et ? formatTimeLocal(et) : null,
        rows_count: 10,
        seats_per_row: Math.ceil((s.capacity || 0) / 10)
      }
    })

    return NextResponse.json(mapped)

  } catch (error) {
    console.error('ERROR SHOWTIMES:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { movie_id, room_id, show_date, show_time, price } = body

    console.log('POST showtime - movie:', movie_id, 'room:', room_id, 'date:', show_date, 'time:', show_time)

    if (!movie_id || !room_id || !show_date || !show_time) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const movieResult = await sql`
      SELECT id, title, duration FROM movies WHERE id = ${movie_id}
    `

    if (!movieResult || movieResult.length === 0) {
      return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    }

    const movie = movieResult[0]
    const durationMinutes = movie.duration || 120

    const [h, m] = show_time.split(':').map(Number)
    const totalMinutes = h * 60 + m + durationMinutes
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    const endTimeStr = `${show_date} ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`

    const startTimeStr = `${show_date} ${show_time}:00`

    const conflictCheck = await sql`
      SELECT s.id, s.start_time, s.end_time, m.title as movie_title, r.name as room_name, r.id as room_id
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.room_id::text = ${room_id}
        AND s.end_time > ${startTimeStr}::timestamp
        AND ${endTimeStr}::timestamp > s.start_time
    `

    console.log('DEBUG POST showtime - movie_id:', movie_id, 'room_id:', room_id)
    console.log('DEBUG - start:', startTimeStr, 'end:', endTimeStr)
    console.log('DEBUG - conflictos encontrados:', conflictCheck?.length || 0)
    console.log('DEBUG - conflictos:', JSON.stringify(conflictCheck))

    if (conflictCheck && conflictCheck.length > 0) {
      const conflict = conflictCheck[0]
      const cStart = new Date(conflict.start_time)
      const cEnd = new Date(conflict.end_time)
      
      return NextResponse.json({ 
        error: `La sala está ocupada. La película "${conflict.movie_title}" está programada en ${conflict.room_name} de ${formatTimeLocal(cStart)} a ${formatTimeLocal(cEnd)}`
      }, { status: 409 })
    }

    const movieConflictCheck = await sql`
      SELECT s.id, s.start_time, s.end_time, m.title as movie_title, r.name as room_name
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.movie_id::text = ${movie_id}
        AND s.room_id::text = ${room_id}
        AND s.end_time > ${startTimeStr}::timestamp
        AND ${endTimeStr}::timestamp > s.start_time
    `

    if (movieConflictCheck && movieConflictCheck.length > 0) {
      const conflict = movieConflictCheck[0]
      const cStart = new Date(conflict.start_time)
      const cEnd = new Date(conflict.end_time)
      return NextResponse.json({ 
        error: `La película "${movie.title}" ya está programada en ${conflict.room_name} de ${formatTimeLocal(cStart)} a ${formatTimeLocal(cEnd)}` 
      }, { status: 409 })
    }

    const result = await sql`
      INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price)
      VALUES (${movie_id}::uuid, ${room_id}::uuid, ${startTimeStr}::timestamp, ${endTimeStr}::timestamp, ${price})
      RETURNING id, movie_id, room_id, start_time, end_time, price, created_at
    `

    const showtimeId = result[0].id

    await sql`
      INSERT INTO showtime_seats (showtime_id, seat_id, status)
      SELECT ${showtimeId}, id, 'available'
      FROM seats
      WHERE room_id = ${room_id}::uuid
    `

    const created = result[0]
    const createdDt = created?.start_time ? new Date(created.start_time) : null
    const createdEt = created?.end_time ? new Date(created.end_time) : null
    const payload = created ? {
      ...created,
      show_date: createdDt ? formatDateLocal(createdDt) : null,
      show_time: createdDt ? formatTimeLocal(createdDt) : null,
      end_time_display: createdEt ? formatTimeLocal(createdEt) : null
    } : created

    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    console.error('Error creating showtime:', error)
    return NextResponse.json({ error: 'Error creating showtime' }, { status: 500 })
  }
}
