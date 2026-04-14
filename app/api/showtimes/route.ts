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

function timeToMinutes(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')
    let showtimes

    if (movieId) {
      showtimes = await sql`
        SELECT s.id, s.movie_id, s.room_id, s.price, s.created_at,
               TO_CHAR(s.start_time AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') as show_date,
               TO_CHAR(s.start_time AT TIME ZONE 'America/Bogota', 'HH24:MI') as show_time,
               TO_CHAR(s.end_time AT TIME ZONE 'America/Bogota', 'HH24:MI') as end_time_display,
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
    } else {
      showtimes = await sql`
        SELECT s.id, s.movie_id, s.room_id, s.price, s.created_at,
               TO_CHAR(s.start_time AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') as show_date,
               TO_CHAR(s.start_time AT TIME ZONE 'America/Bogota', 'HH24:MI') as show_time,
               TO_CHAR(s.end_time AT TIME ZONE 'America/Bogota', 'HH24:MI') as end_time_display,
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
    }

    const mapped = showtimes.map((s: any) => ({
      ...s,
      rows_count: 10,
      seats_per_row: Math.ceil((s.capacity || 0) / 10)
    }))

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

    // Validar horario de operación (10:00 - 23:00)
    const HORA_APERTURA = timeToMinutes('10:00')
    const HORA_CIERRE = timeToMinutes('23:00')
    const MARGEN_LIMPIEZA = 15
    
    const nuevaInicio = timeToMinutes(show_time)
    const nuevaFin = nuevaInicio + durationMinutes + MARGEN_LIMPIEZA
    
    if (nuevaInicio < HORA_APERTURA) {
      return NextResponse.json({ 
        error: `Fuera de horario. El cine abre a las 10:00. Intentaste programar a las ${show_time}.` 
      }, { status: 400 })
    }
    
    if (nuevaFin > HORA_CIERRE) {
      const horaFinReal = minutesToTime(nuevaInicio + durationMinutes)
      return NextResponse.json({ 
        error: `Fuera de horario. La función terminaría a las ${horaFinReal} (limpieza hasta ${minutesToTime(nuevaFin)}), pero el cine cierra a las 23:00.` 
      }, { status: 400 })
    }

    const conflictCheck = await sql`
      SELECT s.id, 
             m.title as movie_title, 
             r.name as room_name,
             EXTRACT(HOUR FROM s.start_time AT TIME ZONE 'America/Bogota') * 60 + EXTRACT(MINUTE FROM s.start_time AT TIME ZONE 'America/Bogota') as existe_inicio,
             EXTRACT(HOUR FROM s.end_time AT TIME ZONE 'America/Bogota') * 60 + EXTRACT(MINUTE FROM s.end_time AT TIME ZONE 'America/Bogota') as existe_fin
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.room_id::text = ${room_id}
        AND DATE(s.start_time AT TIME ZONE 'America/Bogota') = ${show_date}::date
    `

    for (const func of conflictCheck) {
      const existeInicio = Number(func.existe_inicio)
      const existeFin = Number(func.existe_fin)
      const peliculaExistente = func.movie_title
      
      // Verificar solapamiento: nueva empieza antes de que termine la existente
      // Y nueva termina después de que empieza la existente
      if (nuevaInicio < existeFin && nuevaFin > existeInicio) {
        let tipoConflicto = ""
        
        if (nuevaInicio >= existeInicio && nuevaFin <= existeFin) {
          // Caso 1: Nueva función está completamente DENTRO de la existente
          tipoConflicto = `tu función estaría DENTRO del horario de "${peliculaExistente}"`
        } else if (nuevaInicio <= existeInicio && nuevaFin >= existeFin) {
          // Caso 2: Nueva función CONTIENE completamente a la existente
          tipoConflicto = `tu función cubriría completamente a "${peliculaExistente}"`
        } else if (nuevaInicio < existeInicio && nuevaFin > existeInicio && nuevaFin <= existeFin) {
          // Caso 3: Nueva función empieza antes pero termina dentro (solapa el inicio)
          tipoConflicto = `tu función terminaría durante "${peliculaExistente}"`
        } else if (nuevaInicio >= existeInicio && nuevaInicio < existeFin && nuevaFin > existeFin) {
          // Caso 4: Nueva función empieza dentro pero termina después (solapa el final)
          tipoConflicto = `tu función empezaría durante "${peliculaExistente}"`
        } else {
          tipoConflicto = `hay solapamiento con "${peliculaExistente}"`
        }
        
        return NextResponse.json({ 
          error: `❌ Conflicto de horario: ${tipoConflicto}.\n\n` +
                 `📽️ Función existente: "${peliculaExistente}"\n` +
                 `   Horario: ${minutesToTime(existeInicio)} - ${minutesToTime(existeFin)}\n\n` +
                 `🎬 Tu función: "${movie.title}"\n` +
                 `   Horario: ${show_time} - ${minutesToTime(nuevaInicio + durationMinutes)}\n` +
                 `   (Incluye ${MARGEN_LIMPIEZA} min de limpieza: hasta ${minutesToTime(nuevaFin)})`
        }, { status: 409 })
      }
    }

    const movieConflictCheck = await sql`
      SELECT s.id, 
             m.title as movie_title, 
             r.name as room_name,
             EXTRACT(HOUR FROM s.start_time AT TIME ZONE 'America/Bogota') * 60 + EXTRACT(MINUTE FROM s.start_time AT TIME ZONE 'America/Bogota') as existe_inicio,
             EXTRACT(HOUR FROM s.end_time AT TIME ZONE 'America/Bogota') * 60 + EXTRACT(MINUTE FROM s.end_time AT TIME ZONE 'America/Bogota') as existe_fin
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.movie_id::text = ${movie_id}
        AND s.room_id::text = ${room_id}
        AND DATE(s.start_time AT TIME ZONE 'America/Bogota') = ${show_date}::date
    `

    for (const func of movieConflictCheck) {
      const existeInicio = Number(func.existe_inicio)
      const existeFin = Number(func.existe_fin)
      
      if (nuevaInicio < existeFin && nuevaFin > existeInicio) {
        return NextResponse.json({ 
          error: `La película "${movie.title}" ya está programada en ${func.room_name} de ${minutesToTime(existeInicio)} a ${minutesToTime(existeFin)}` 
        }, { status: 409 })
      }
    }

    const endTimeFormatted = minutesToTime(nuevaFin)
    const startDateTime = `${show_date} ${show_time}:00`
    const endDateTime = `${show_date} ${endTimeFormatted}:00`
    
    const result = await sql`
      INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price)
      VALUES (
        ${movie_id}::uuid, 
        ${room_id}::uuid, 
        ${startDateTime}::timestamp at time zone 'America/Bogota', 
        ${endDateTime}::timestamp at time zone 'America/Bogota', 
        ${price}
      )
      RETURNING id, movie_id, room_id, start_time AT TIME ZONE 'America/Bogota' as start_time_local, end_time AT TIME ZONE 'America/Bogota' as end_time_local, price, created_at
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
      ...created,
      show_date: show_date,
      show_time: show_time,
      end_time_display: endTimeFormatted
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating showtime:', error)
    return NextResponse.json({ error: 'Error creating showtime' }, { status: 500 })
  }
}
