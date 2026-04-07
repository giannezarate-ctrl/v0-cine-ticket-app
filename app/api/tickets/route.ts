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
      SELECT 
        t.*, 
        m.title as movie_title, 
        s.start_time as show_time, 
        r.name as room_name,
        u.name as customer_name,
        (SELECT row FROM seats st JOIN ticket_seats ts ON st.id = ts.seat_id WHERE ts.ticket_id = t.id LIMIT 1) as seat_row,
        (SELECT number FROM seats st JOIN ticket_seats ts ON st.id = ts.seat_id WHERE ts.ticket_id = t.id LIMIT 1) as seat_number
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `

    
    // Map to compatibility fields
    const mapped = tickets.map((t: any) => {
      const dt = t.show_time ? new Date(t.show_time) : null
      return {
        ...t,
        ticket_code: t.code,
        is_validated: t.status === 'used',
        show_date: dt ? dt.toISOString().split('T')[0] : null,
        show_time: dt ? dt.toTimeString().slice(0, 5) : null
      }
    })

    return NextResponse.json(mapped)

  } catch (error) {
    console.error('ERROR TICKETS:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { showtime_id, seats, user_id, customer_name, customer_email } = body

    // Get showtime and room info
    const showtimeResult = await sql`
      SELECT s.price, s.room_id 
      FROM showtimes s 
      WHERE s.id = ${showtime_id}
    `
    const { price: showtimePrice, room_id } = showtimeResult[0] || {}

    if (!showtimePrice) {
      return NextResponse.json({ error: 'Showtime not found' }, { status: 404 })
    }

    // Resolve coordinates into seat IDs
    const seat_ids = []
    for (const s of seats) {
      const seatRes = await sql`
        SELECT id FROM seats 
        WHERE room_id = ${room_id} AND row = ${s.row} AND number = ${s.number}
      `
      if (seatRes[0]) {
        seat_ids.push(seatRes[0].id)
      }
    }

    if (seat_ids.length !== seats.length) {
      return NextResponse.json({ error: 'Algunos asientos no existen en esta sala' }, { status: 400 })
    }

    // Check if seats are available in showtime_seats
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
    const ticketSeats = await sql`
      SELECT s.id, s.row, s.number
      FROM seats s
      WHERE s.id = ANY(${seat_ids})
    `

    return NextResponse.json({ ...ticket, seats: ticketSeats }, { status: 201 })

  } catch (error) {
    console.error('Error creating tickets:', error)
    const message = error instanceof Error ? error.message : 'Error creating tickets'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
