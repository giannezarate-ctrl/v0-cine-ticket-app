import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get all seats with their status for this showtime
    const seats = await sql`
      SELECT 
        s.id,
        s.row, 
        s.number,
        ss.status
      FROM seats s
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN showtime_seats ss ON s.id = ss.seat_id AND ss.showtime_id = ${id}
      WHERE r.id IN (SELECT room_id FROM showtimes WHERE id = ${id})
      ORDER BY s.row, s.number
    `
    
    // Get the room for this showtime
    const showtime = await sql`
      SELECT r.id, r.name, r.capacity
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = ${id}
    `
    
    return NextResponse.json({
      showtime: showtime[0] || null,
      seats: seats.map(seat => ({
        id: seat.id,
        row: seat.row,
        number: seat.number,
        status: seat.status || 'available'
      }))
    })
  } catch (error) {
    console.error('Error fetching seats:', error)
    return NextResponse.json({ error: 'Error fetching seats' }, { status: 500 })
  }
}
