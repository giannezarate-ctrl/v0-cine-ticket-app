import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function extractTimeFromDateString(dateStr: string): { hours: number; minutes: number } | null {
  if (!dateStr) return null
  
  const str = String(dateStr)
  
  const match = str.match(/(\d{1,2}):(\d{2}):(\d{2})/)
  if (match) {
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) }
  }
  
  return null
}

function formatTimeFromDateString(dateStr: string): string | null {
  const result = extractTimeFromDateString(dateStr)
  if (result) {
    return `${String(result.hours).padStart(2, '0')}:${String(result.minutes).padStart(2, '0')}`
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
    
    console.log('[VALIDATE] start_time:', ticket.start_time, typeof ticket.start_time)
    console.log('[VALIDATE] end_time:', ticket.end_time, typeof ticket.end_time)
    
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    
    const startTime = extractTimeFromDateString(ticket.start_time)
    const endTime = extractTimeFromDateString(ticket.end_time)
    
    console.log('[VALIDATE] startTime:', startTime)
    console.log('[VALIDATE] endTime:', endTime)
    console.log('[VALIDATE] nowMinutes:', nowMinutes)
    
    if (!startTime || !endTime) {
      return NextResponse.json(
        { valid: false, error: 'Error al procesar horarios de la función' },
        { status: 500 }
      )
    }
    
    const startMinutes = startTime.hours * 60 + startTime.minutes
    const endMinutes = endTime.hours * 60 + endTime.minutes
    const tenMinutesBefore = startMinutes - 10
    
    console.log('[VALIDATE] startMinutes:', startMinutes, 'endMinutes:', endMinutes, 'tenMinutesBefore:', tenMinutesBefore)
    
    const canValidate = nowMinutes >= tenMinutesBefore && nowMinutes <= endMinutes
    
    if (!canValidate) {
      let timeError = ''
      
      const startTimeStr = formatTimeFromDateString(ticket.start_time)
      const endTimeStr = formatTimeFromDateString(ticket.end_time)
      
      if (nowMinutes < tenMinutesBefore) {
        const waitMinutes = tenMinutesBefore - nowMinutes
        timeError = `Es muy pronto para validar. La función inicia a las ${startTimeStr}. Debes esperar ${waitMinutes} minuto(s).`
      } else {
        timeError = `La función ya terminó. Esta función terminó a las ${endTimeStr}.`
      }
      
      return NextResponse.json({
        valid: false,
        error: timeError,
        ticket: {
          ...ticket,
          show_date: String(ticket.start_time).split(' ')[0],
          show_time: startTimeStr,
          seat_row: ticket.seats_list ? ticket.seats_list.split(', ')[0].charAt(0) : null,
          seat_number: ticket.seats_list ? parseInt(ticket.seats_list.split(', ')[0].substring(1)) : null,
        }
      }, { status: 400 })
    }
    
    const formattedTicket = {
      ...ticket,
      show_date: String(ticket.start_time).split(' ')[0],
      show_time: formatTimeFromDateString(ticket.start_time),
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
