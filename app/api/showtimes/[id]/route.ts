import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

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

    const start_time = new Date(`${show_date}T${show_time}`).toISOString()

    const result = await sql`
      UPDATE showtimes 
      SET start_time = ${start_time}, price = ${price}
      WHERE id = ${id}
      RETURNING id, start_time, price
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
