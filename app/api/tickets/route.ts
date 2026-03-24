import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  try {
    const tickets = await sql`
      SELECT t.*, m.title as movie_title, m.id as movie_id, s.show_date, s.show_time, r.name as room_name
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      ORDER BY t.purchase_date DESC
    `
    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { showtime_id, seats, customer_name, customer_email } = body

    const showtimeResult = await sql`
      SELECT price FROM showtimes WHERE id = ${showtime_id}
    `
    const showtimePrice = showtimeResult[0]?.price

    const createdTickets = []
    
    for (const seat of seats) {
      const ticketCode = generateTicketCode()
      
      const existing = await sql`
        SELECT id FROM tickets 
        WHERE showtime_id = ${showtime_id} 
        AND seat_row = ${seat.row} 
        AND seat_number = ${seat.number}
      `
      
      if (existing.length > 0) {
        return NextResponse.json(
          { error: `El asiento ${seat.row}${seat.number} ya está ocupado` },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO tickets (showtime_id, seat_row, seat_number, ticket_code, customer_name, customer_email, price)
        VALUES (${showtime_id}, ${seat.row}, ${seat.number}, ${ticketCode}, ${customer_name}, ${customer_email}, ${showtimePrice})
        RETURNING *
      `
      createdTickets.push(result[0])
    }
    
    return NextResponse.json(createdTickets, { status: 201 })
  } catch (error) {
    console.error('Error creating tickets:', error)
    const message = error instanceof Error ? error.message : 'Error creating tickets'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
