import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

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
    
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    
    const startTimeStr = String(ticket.start_time)
    const endTimeStr = String(ticket.end_time)
    
    const startTimePart = startTimeStr.split(' ')[1]?.slice(0, 5) || null
    const endTimePart = endTimeStr.split(' ')[1]?.slice(0, 5) || null
    
    const [startHour, startMin] = (startTimePart || '00:00').split(':').map(Number)
    const [endHour, endMin] = (endTimePart || '00:00').split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const tenMinutesBefore = startMinutes - 10
    
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
          show_date: startTimeStr.split(' ')[0],
          show_time: startTimePart,
          seat_row: ticket.seats_list ? ticket.seats_list.split(', ')[0].charAt(0) : null,
          seat_number: ticket.seats_list ? parseInt(ticket.seats_list.split(', ')[0].substring(1)) : null,
        }
      }, { status: 400 })
    }
    
    const formattedTicket = {
      ...ticket,
      show_date: startTimeStr.split(' ')[0],
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
