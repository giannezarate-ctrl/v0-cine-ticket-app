import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'TKT-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  try {
    const tickets = await sql`
      SELECT t.*, m.title as movie_title, s.start_time as show_time, r.name as room_name
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      ORDER BY t.created_at DESC
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
    const { showtime_id, seat_ids, user_id, customer_name, customer_email } = body

    // Get showtime price
    const showtimeResult = await sql`
      SELECT price FROM showtimes WHERE id = ${showtime_id}
    `
    const showtimePrice = showtimeResult[0]?.price

    if (!showtimePrice) {
      return NextResponse.json({ error: 'Showtime not found' }, { status: 404 })
    }

    // Check if seats are available
    const unavailableSeats = await sql`
      SELECT ss.id, s.row, s.number
      FROM showtime_seats ss
      JOIN seats s ON ss.seat_id = s.id
      WHERE ss.showtime_id = ${showtime_id} 
      AND ss.seat_id = ANY(${seat_ids})
      AND ss.status != 'available'
    `

    if (unavailableSeats.length > 0) {
      return NextResponse.json(
        { error: 'Algunos asientos ya están reservados o vendidos' },
        { status: 400 }
      )
    }

    // Create ticket
    const ticketCode = generateTicketCode()
    const total = showtimePrice * seat_ids.length

    const [ticket] = await sql`
      INSERT INTO tickets (user_id, showtime_id, code, total, status)
      VALUES (${user_id}, ${showtime_id}, ${ticketCode}, ${total}, 'active')
      RETURNING id, user_id, showtime_id, code, total, status, created_at
    `

    // Update seat status to sold and create ticket_seats relation
    for (const seatId of seat_ids) {
      await sql`
        UPDATE showtime_seats 
        SET status = 'sold' 
        WHERE showtime_id = ${showtime_id} AND seat_id = ${seatId}
      `
      
      await sql`
        INSERT INTO ticket_seats (ticket_id, seat_id)
        VALUES (${ticket.id}, ${seatId})
      `
    }

    // Get seat details for response
    const seats = await sql`
      SELECT s.id, s.row, s.number
      FROM seats s
      WHERE s.id = ANY(${seat_ids})
    `

    return NextResponse.json({ ...ticket, seats }, { status: 201 })
  } catch (error) {
    console.error('Error creating tickets:', error)
    const message = error instanceof Error ? error.message : 'Error creating tickets'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
