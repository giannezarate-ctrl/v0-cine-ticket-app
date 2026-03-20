import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticket_code } = body
    
    const tickets = await sql`
      SELECT t.*, m.title as movie_title, s.show_date, s.show_time, r.name as room_name
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE t.ticket_code = ${ticket_code.toUpperCase()}
    `
    
    if (tickets.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Código de tiquete no encontrado' },
        { status: 404 }
      )
    }
    
    const ticket = tickets[0]
    
    if (ticket.is_validated) {
      return NextResponse.json({
        valid: false,
        error: 'Este tiquete ya fue validado',
        ticket,
        validated_at: ticket.validated_at
      })
    }
    
    // Validate the ticket
    await sql`
      UPDATE tickets 
      SET is_validated = true, validated_at = NOW()
      WHERE id = ${ticket.id}
    `
    
    return NextResponse.json({
      valid: true,
      message: 'Tiquete validado exitosamente',
      ticket: { ...ticket, is_validated: true }
    })
  } catch (error) {
    console.error('Error validating ticket:', error)
    return NextResponse.json({ error: 'Error validating ticket' }, { status: 500 })
  }
}
