import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function extractTimePart(timestampStr: string): string | null {
  if (!timestampStr) return null
  
  const str = String(timestampStr)
  
  if (str.includes('T')) {
    const parts = str.split('T')
    if (parts[1]) {
      return parts[1].slice(0, 5)
    }
  }
  
  const spaceParts = str.split(' ')
  if (spaceParts[1]) {
    return spaceParts[1].slice(0, 5)
  }
  
  return null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let { ticket_code } = body
    
    console.log('[VALIDATE] Input code:', ticket_code)
    
    ticket_code = ticket_code.trim().toUpperCase()
    if (ticket_code.startsWith('TKT-')) {
      ticket_code = ticket_code.substring(4)
    }
    
    console.log('[VALIDATE] Cleaned code:', ticket_code)
    
    let searchCode = 'TKT-' + ticket_code
    
    const tickets = await sql`
      SELECT 
        t.*, 
        m.title as movie_title, 
        s.start_time,
        s.end_time,
        r.name as room_name,
        u.name as customer_name,
        u.email as customer_email,
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
    
    console.log('[VALIDATE] start_time raw:', ticket.start_time)
    console.log('[VALIDATE] end_time raw:', ticket.end_time)
    
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    
    const startTimePart = extractTimePart(ticket.start_time)
    const endTimePart = extractTimePart(ticket.end_time)
    
    console.log('[VALIDATE] startTimePart:', startTimePart)
    console.log('[VALIDATE] endTimePart:', endTimePart)
    console.log('[VALIDATE] nowMinutes:', nowMinutes)
    
    if (!startTimePart || !endTimePart) {
      return NextResponse.json(
        { valid: false, error: 'Error al procesar horarios de la función' },
        { status: 500 }
      )
    }
    
    const [startHour, startMin] = startTimePart.split(':').map(Number)
    const [endHour, endMin] = endTimePart.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const tenMinutesBefore = startMinutes - 10
    
    console.log('[VALIDATE] startMinutes:', startMinutes, 'endMinutes:', endMinutes, 'tenMinutesBefore:', tenMinutesBefore)
    
    const canValidate = nowMinutes >= tenMinutesBefore && nowMinutes <= endMinutes
    
    if (!canValidate) {
      let timeError = ''
      
      if (nowMinutes < tenMinutesBefore) {
        const waitMinutes = tenMinutesBefore - nowMinutes
        timeError = `Es muy pronto para validar. La función inicia a las ${startTimePart}. Debes esperar ${waitMinutes} minuto(s).`
      } else {
        timeError = `La función ya terminó. Esta función terminó a las ${endTimePart}.`
      }
      
      return NextResponse.json({
        valid: false,
        error: timeError,
        ticket: {
          ...ticket,
          show_date: String(ticket.start_time).split(' ')[0],
          show_time: startTimePart,
          seat_row: ticket.seats_list ? ticket.seats_list.split(', ')[0].charAt(0) : null,
          seat_number: ticket.seats_list ? parseInt(ticket.seats_list.split(', ')[0].substring(1)) : null,
        }
      }, { status: 400 })
    }
    
    const formattedTicket = {
      ...ticket,
      show_date: String(ticket.start_time).split(' ')[0],
      show_time: startTimePart,
      seat_row: ticket.seats_list ? ticket.seats_list.split(', ')[0].charAt(0) : null,
      seat_number: ticket.seats_list ? parseInt(ticket.seats_list.split(', ')[0].substring(1)) : null,
    }
    
    if (ticket.status === 'used') {
      return NextResponse.json({
        valid: false,
        error: 'Este tiquete ya fue utilizado',
        ticket: formattedTicket,
        validated_at: ticket.validated_at
      })
    }
    
    if (ticket.status === 'cancelled') {
      return NextResponse.json({
        valid: false,
        error: 'Este tiquete ha sido cancelado',
        ticket: formattedTicket
      })
    }
    
    await sql`
      UPDATE tickets 
      SET status = 'used', validated_at = NOW()
      WHERE id = ${ticket.id}
    `
    
    return NextResponse.json({
      valid: true,
      message: 'Tiquete validado exitosamente',
      ticket: { ...formattedTicket, status: 'used' }
    })
  } catch (error) {
    console.error('Error validating ticket:', error)
    return NextResponse.json({ error: 'Error validating ticket' }, { status: 500 })
  }
}
