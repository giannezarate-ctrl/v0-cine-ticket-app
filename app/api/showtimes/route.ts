import { sql, setTimezone } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  await setTimezone()
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (movieId) {
      const showtimes = await sql`
        SELECT s.id, s.movie_id, s.room_id, s.price, s.created_at,
               to_char(s.start_time + interval '1 day', 'YYYY-MM-DD') as show_date,
               to_char(s.start_time, 'HH24:MI') as show_time,
               to_char(s.end_time, 'HH24:MI') as end_time_display,
               m.title as movie_title, m.poster_url as movie_poster, r.name as room_name, r.capacity,
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

      const mapped = showtimes.map((s: any) => ({
        ...s,
        rows_count: 10,
        seats_per_row: Math.ceil((s.capacity || 0) / 10)
      }))
      return NextResponse.json(mapped)
    } else {
      const showtimes = await sql`
        SELECT s.id, s.movie_id, s.room_id, s.price, s.created_at,
               to_char(s.start_time + interval '1 day', 'YYYY-MM-DD') as show_date,
               to_char(s.start_time, 'HH24:MI') as show_time,
               to_char(s.end_time, 'HH24:MI') as end_time_display,
               m.title as movie_title, m.poster_url as movie_poster, r.name as room_name, r.capacity,
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

      const mapped = showtimes.map((s: any) => ({
        ...s,
        rows_count: 10,
        seats_per_row: Math.ceil((s.capacity || 0) / 10)
      }))
      return NextResponse.json(mapped)
    }

  } catch (error) {
    console.error('ERROR SHOWTIMES:', error)
    return NextResponse.json({ error: 'Error fetching showtimes', details: String(error) }, { status: 500 })
  }
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function POST(request: Request) {
  try {
    await setTimezone()
    const body = await request.json()
    const { movie_id, room_id, show_date, show_time, price } = body

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
    const MARGEN_LIMPIEZA = 15

    const HORA_APERTURA = 10 * 60
    const HORA_CIERRE = 23 * 60
    
    const nuevaInicio = timeToMinutes(show_time)
    const nuevaFin = nuevaInicio + durationMinutes + MARGEN_LIMPIEZA
    
    if (nuevaInicio < HORA_APERTURA) {
      return NextResponse.json({ 
        error: `Fuera de horario. El cine abre a las 10:00.` 
      }, { status: 400 })
    }
    
    if (nuevaFin > HORA_CIERRE) {
      return NextResponse.json({ 
        error: `Fuera de horario. La función terminaría a las ${minutesToTime(nuevaInicio + durationMinutes)}.` 
      }, { status: 400 })
    }

    const actualDate = show_date
    
    const conflictCheck = await sql`
      SELECT s.id, 
             m.title as movie_title, 
             r.name as room_name,
             EXTRACT(HOUR FROM s.start_time) * 60 + EXTRACT(MINUTE FROM s.start_time) as existe_inicio,
             EXTRACT(HOUR FROM s.end_time) * 60 + EXTRACT(MINUTE FROM s.end_time) as existe_fin
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.room_id::text = ${room_id}
        AND to_char(s.start_time, 'YYYY-MM-DD') = ${actualDate}
    `

    for (const func of conflictCheck) {
      const existeInicio = Number(func.existe_inicio)
      const existeFin = Number(func.existe_fin)
      const peliculaExistente = func.movie_title
      
      if (nuevaInicio < existeFin && nuevaFin > existeInicio) {
        return NextResponse.json({ 
          error: `Conflicto con "${peliculaExistente}" de ${minutesToTime(existeInicio)} a ${minutesToTime(existeFin)}` 
        }, { status: 409 })
      }
    }

    const endTimeFormatted = minutesToTime(nuevaFin)
    const startDateTime = `${actualDate} ${show_time}:00`
    const endDateTime = `${actualDate} ${endTimeFormatted}:00`
    
    const result = await sql`
      INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price)
      VALUES (
        ${movie_id}::uuid, 
        ${room_id}::uuid, 
        ${startDateTime}, 
        ${endDateTime}, 
        ${price}
      )
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
    return NextResponse.json({
      id: created.id,
      movie_id: created.movie_id,
      room_id: created.room_id,
      show_date: show_date,
      show_time: show_time,
      end_time_display: endTimeFormatted,
      price: created.price
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating showtime:', error)
    return NextResponse.json({ error: 'Error creating showtime' }, { status: 500 })
  }
}
