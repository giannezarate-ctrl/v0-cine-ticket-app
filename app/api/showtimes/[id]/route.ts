import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
