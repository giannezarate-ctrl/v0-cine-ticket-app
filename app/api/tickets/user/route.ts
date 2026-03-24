import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tickets = await sql`
      SELECT 
        t.id,
        t.ticket_code as codigo,
        t.showtime_id as funcion_id,
        t.seat_row as fila,
        t.seat_number as columna,
        t.price as precio,
        t.status as estado,
        t.customer_name as comprador_nombre,
        t.customer_email as comprador_email,
        t.is_validated as validado,
        t.purchase_date as created_at,
        s.show_date,
        s.show_time,
        m.title as movie_title,
        r.name as room_name
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      LEFT JOIN movies m ON s.movie_id = m.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE t.customer_email = ${user.email}
      ORDER BY t.purchase_date DESC
    `

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching user tickets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}