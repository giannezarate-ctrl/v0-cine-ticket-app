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
      SELECT r.id, r.name, r.capacity
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = ${id}
    `
    
    if (!showtimeData[0]) {
      return NextResponse.json({ error: 'Showtime not found' }, { status: 404 })
    }
    
    const { id: room_id, name, capacity } = showtimeData[0]
    const rows_count = 10
    const seats_per_row = Math.ceil((capacity || 0) / 10)
    
    // Get seat statuses from showtime_seats table
    const seatStatuses = await sql`
      SELECT s.row, s.number, ss.status
      FROM showtime_seats ss
      JOIN seats s ON ss.seat_id = s.id
      WHERE ss.showtime_id = ${id}
    `
    
    const statusMap = new Map(seatStatuses.map(s => [`${s.row}-${s.number}`, s.status]))
    
    // Generate all potential seats and their actual status
    const seats = []
    for (let row = 0; row < rows_count; row++) {
      const rowLetter = String.fromCharCode(65 + row)
      for (let num = 1; num <= seats_per_row; num++) {
        const currentStatus = statusMap.get(`${rowLetter}-${num}`) || 'available'
        seats.push({
          id: `${room_id}-${rowLetter}-${num}`,
          row: rowLetter,
          number: num,
          status: currentStatus === 'available' ? 'available' : 'occupied'
        })
      }
    }
    
    return NextResponse.json({
      showtime: { id: room_id, name, total_seats: capacity },
      seats
    })

  } catch (error) {
    console.error('Error fetching seats:', error)
    return NextResponse.json({ error: 'Error fetching seats' }, { status: 500 })
  }
}
