import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get room info for this showtime
    const showtimeData = await sql`
      SELECT r.id, r.name, r.rows_count, r.seats_per_row
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = ${id}
    `
    
    if (!showtimeData[0]) {
      return NextResponse.json({ error: 'Showtime not found' }, { status: 404 })
    }
    
    const { id: room_id, name, rows_count, seats_per_row } = showtimeData[0]
    
    // Get all booked seats for this showtime
    const bookedSeats = await sql`
      SELECT seat_row, seat_number
      FROM tickets
      WHERE showtime_id = ${id}
    `
    
    const bookedSet = new Set(bookedSeats.map(t => `${t.seat_row}-${t.seat_number}`))
    
    // Generate all seats
    const seats = []
    for (let row = 0; row < rows_count; row++) {
      const rowLetter = String.fromCharCode(65 + row)
      for (let num = 1; num <= seats_per_row; num++) {
        seats.push({
          id: `${room_id}-${rowLetter}-${num}`,
          row: rowLetter,
          number: num,
          status: bookedSet.has(`${rowLetter}-${num}`) ? 'occupied' : 'available'
        })
      }
    }
    
    return NextResponse.json({
      showtime: { id: room_id, name, total_seats: rows_count * seats_per_row },
      seats
    })
  } catch (error) {
    console.error('Error fetching seats:', error)
    return NextResponse.json({ error: 'Error fetching seats' }, { status: 500 })
  }
}
