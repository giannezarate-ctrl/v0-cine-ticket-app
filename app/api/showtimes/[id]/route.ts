import { sql, setTimezone } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await setTimezone()
    const { id } = await params
    
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
    
    const hoursSinceStart = (now.getTime() - showtimeDate.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceStart > -1 && hoursSinceStart < 4) {
      return NextResponse.json({ 
        error: 'No puedes eliminar una función en curso o próxima.' 
      }, { status: 400 })
    }
    
    if (Number(ticket_count) > 0 && hoursSinceStart < 0) {
      return NextResponse.json({ 
        error: 'Esta función tiene tickets activos.' 
      }, { status: 400 })
    }
    
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

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await setTimezone()
    const { id } = await params
    const body = await request.json()
    const { show_date, show_time, price } = body

    if (!show_date || !show_time || !price) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
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
    const MARGEN_LIMPIEZA = 15

    const nuevaInicio = timeToMinutes(show_time)
    const nuevaFin = nuevaInicio + durationMinutes + MARGEN_LIMPIEZA

    const endTimeFormatted = minutesToTime(nuevaInicio + durationMinutes)
    
    const startDateTime = `${show_date} ${show_time}:00`
    const endDateTime = `${show_date} ${endTimeFormatted}:00`

    const result = await sql`
      UPDATE showtimes 
      SET start_time = ${startDateTime}::timestamp without time zone, 
          end_time = ${endDateTime}::timestamp without time zone,
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
