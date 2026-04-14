import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { 
  TIMEZONE,
  OPERATING_START_HOUR, 
  OPERATING_END_HOUR, 
  CLEANING_MARGIN_MINUTES,
  timeToMinutes, 
  minutesToTime 
} from '@/lib/timezone'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if showtime has started (has active tickets)
    const showtimeCheck = await sql`
      SELECT s.start_time, COUNT(t.id) as ticket_count
      FROM showtimes s
      LEFT JOIN tickets t ON t.showtime_id = s.id AND t.status = 'active'
      WHERE s.id = ${id}
      GROUP BY s.id, s.start_time
    `
    
    if (showtimeCheck.length === 0) {
      return NextResponse.json({ error: 'Función no encontrada' }, { status: 404 })
    }
    
    const { start_time, ticket_count } = showtimeCheck[0]
    const showtimeDate = new Date(start_time)
    const now = new Date()
    
    // Don't allow deleting showtimes that have started within the last 4 hours
    const hoursSinceStart = (now.getTime() - showtimeDate.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceStart > -1 && hoursSinceStart < 4) {
      return NextResponse.json({ 
        error: '400_SHOWTIME_ACTIVE: No puedes eliminar una función que está en curso o próxima a comenzar. Espera al menos 4 horas después de la hora de inicio.' 
      }, { status: 400 })
    }
    
    if (Number(ticket_count) > 0 && hoursSinceStart < 0) {
      return NextResponse.json({ 
        error: '400_HAS_TICKETS: Esta función tiene tickets activos. Espera a que terminen las funciones o cancela los tickets primero.' 
      }, { status: 400 })
    }
    
    // Explicit manual deletes to avoid FK constraint errors if ON DELETE CASCADE isn't set up
    await sql`DELETE FROM ticket_seats WHERE ticket_id IN (SELECT id FROM tickets WHERE showtime_id = ${id})`
    await sql`DELETE FROM tickets WHERE showtime_id = ${id}`
    await sql`DELETE FROM showtime_seats WHERE showtime_id = ${id}`
    
    const result = await sql`DELETE FROM showtimes WHERE id = ${id} RETURNING id`
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Función no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error deleting showtime:', error)
    return NextResponse.json({ error: 'Error al eliminar la función' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { show_date, show_time, price } = body

    if (!show_date || !show_time || !price) {
      return NextResponse.json({ error: 'Faltan datos requeridos (fecha, hora o precio)' }, { status: 400 })
    }

    const showtimeResult = await sql`
      SELECT s.*, m.duration as movie_duration
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      WHERE s.id = ${id}
    `

    if (showtimeResult.length === 0) {
      return NextResponse.json({ error: 'Función no encontrada' }, { status: 404 })
    }

    const showtime = showtimeResult[0]
    const roomIdText = showtime.room_id.toString()
    const durationMinutes = showtime.movie_duration || 120

    // Validar horario de operación (10:00 - 23:00) São Paulo timezone
    const HORA_APERTURA = OPERATING_START_HOUR * 60
    const HORA_CIERRE = OPERATING_END_HOUR * 60
    const MARGEN_LIMPIEZA = CLEANING_MARGIN_MINUTES

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

    const endTimeFormatted = minutesToTime(nuevaInicio + durationMinutes)

    const conflictCheck = await sql`
      SELECT s.id, m.title as movie_title, r.name as room_name,
              EXTRACT(HOUR FROM s.start_time AT TIME ZONE 'America/Sao_Paulo') * 60 + EXTRACT(MINUTE FROM s.start_time AT TIME ZONE 'America/Sao_Paulo') as existe_inicio,
              EXTRACT(HOUR FROM s.end_time AT TIME ZONE 'America/Sao_Paulo') * 60 + EXTRACT(MINUTE FROM s.end_time AT TIME ZONE 'America/Sao_Paulo') as existe_fin
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.room_id::text = ${roomIdText}
        AND s.id != ${id}
        AND DATE(s.start_time AT TIME ZONE 'America/Sao_Paulo') = ${show_date}::date
    `

    for (const func of conflictCheck) {
      const existeInicio = Number(func.existe_inicio)
      const existeFin = Number(func.existe_fin)
      const peliculaExistente = func.movie_title

      // Verificar solapamiento considerando margen de limpieza
      if (nuevaInicio < existeFin && nuevaFin > existeInicio) {
        let tipoConflicto = ""
        
        if (nuevaInicio >= existeInicio && nuevaFin <= existeFin) {
          tipoConflicto = `tu función estaría DENTRO del horario de "${peliculaExistente}"`
        } else if (nuevaInicio <= existeInicio && nuevaFin >= existeFin) {
          tipoConflicto = `tu función cubriría completamente a "${peliculaExistente}"`
        } else if (nuevaInicio < existeInicio && nuevaFin > existeInicio && nuevaFin <= existeFin) {
          tipoConflicto = `tu función terminaría durante "${peliculaExistente}"`
        } else if (nuevaInicio >= existeInicio && nuevaInicio < existeFin && nuevaFin > existeFin) {
          tipoConflicto = `tu función empezaría durante "${peliculaExistente}"`
        } else {
          tipoConflicto = `hay solapamiento con "${peliculaExistente}"`
        }
        
        const showtimeResult = await sql`
          SELECT m.title FROM showtimes s JOIN movies m ON s.movie_id = m.id WHERE s.id = ${id}
        `
        const movieTitle = showtimeResult[0]?.title || 'Película'
        
        return NextResponse.json({
          error: `❌ Conflicto de horario: ${tipoConflicto}.\n\n` +
                 `📽️ Función existente: "${peliculaExistente}"\n` +
                 `   Horario: ${minutesToTime(existeInicio)} - ${minutesToTime(existeFin)}\n\n` +
                 `🎬 Tu función: "${movieTitle}"\n` +
                 `   Horario: ${show_time} - ${endTimeFormatted}\n` +
                 `   (Incluye ${MARGEN_LIMPIEZA} min de limpieza: hasta ${minutesToTime(nuevaFin)})`
        }, { status: 409 })
      }
    }

    const startDateTime = `${show_date} ${show_time}:00`
    const endDateTime = `${show_date} ${endTimeFormatted}:00`

    const result = await sql`
      UPDATE showtimes 
      SET start_time = ${startDateTime}::timestamp at time zone 'America/Sao_Paulo', 
          end_time = ${endDateTime}::timestamp at time zone 'America/Sao_Paulo',
          price = ${price}
      WHERE id = ${id}
      RETURNING id, start_time, end_time, price
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Función no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, showtime: result[0] })
  } catch (error) {
    console.error('Error updating showtime:', error)
    return NextResponse.json({ error: 'Error al actualizar la función' }, { status: 500 })
  }
}
