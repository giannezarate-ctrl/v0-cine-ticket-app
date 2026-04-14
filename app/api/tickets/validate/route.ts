import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function extractTimeFromTimestamp(timestamp: any): { hours: number; minutes: number } | null {
  const str = String(timestamp)
  const match = str.match(/(\d{2}):(\d{2}):(\d{2})/)
  if (match) {
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) }
  }
  const match2 = str.match(/T(\d{2}):(\d{2}):/)
  if (match2) {
    return { hours: parseInt(match2[1]), minutes: parseInt(match2[2]) }
  }
  return null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let { ticket_code } = body
    
    ticket_code = ticket_code.trim().toUpperCase()
    if (ticket_code.startsWith('TKT-')) {
      ticket_code = ticket_code.substring(4)
    }
    
    let searchCode = 'TKT-' + ticket_code
    
    const tickets = await sql`
      SELECT 
        t.*, 
        m.title as movie_title, 
        s.start_time,
        s.end_time,
        r.name as room_name,
        u.name as customer_name,
        (SELECT string_agg(st.row || st.number, ', ') FROM ticket_seats ts JOIN seats st ON ts.seat_id = st.id WHERE ts.ticket_id = t.id) as seats_list
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.code = ${searchCode}
    `
    
    if (tickets.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Código de tiquete no encontrado' },
        { status: 404 }
      )
    }
    
    const ticket = tickets[0]
    const startTime = extractTimeFromTimestamp(ticket.start_time)
    const endTime = extractTimeFromTimestamp(ticket.end_time)
    
    if (!startTime || !endTime) {
      return NextResponse.json(
        { valid: false, error: 'Error al procesar horarios de la función' },
        { status: 500 }
      )
    }
    
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = startTime.hours * 60 + startTime.minutes
    const endMinutes = endTime.hours * 60 + endTime.minutes
    const tenMinutesBefore = startMinutes - 10
    
    if (nowMinutes < tenMinutesBefore) {
      const waitMinutes = tenMinutesBefore - nowMinutes
      return NextResponse.json({
        valid: false,
        error: `Es muy pronto para validar. La función inicia a las ${String(startTime.hours).padStart(2, '0')}:${String(startTime.minutes).padStart(2, '0')}. Debes esperar ${waitMinutes} minuto(s).`
      }, { status: 400 })
    }
    
    if (nowMinutes > endMinutes) {
      return NextResponse.json({
        valid: false,
        error: `La función ya terminó.`
      }, { status: 400 })
    }
    
    if (ticket.status === 'used') {
      return NextResponse.json({
        valid: false,
        error: 'Este tiquete ya fue utilizado'
      })
    }
    
    if (ticket.status === 'cancelled') {
      return NextResponse.json({
        valid: false,
        error: 'Este tiquete ha sido cancelado'
      })
    }
    
    await sql`
      UPDATE tickets 
      SET status = 'used', validated_at = NOW()
      WHERE id = ${ticket.id}
    `
    
    return NextResponse.json({
      valid: true,
      message: 'Tiquete validado exitosamente'
    })
  } catch (error) {
    console.error('Error validating ticket:', error)
    return NextResponse.json({ error: 'Error validating ticket' }, { status: 500 })
  }
}
