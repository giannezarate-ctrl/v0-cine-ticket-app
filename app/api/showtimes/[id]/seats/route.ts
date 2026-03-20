import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const occupiedSeats = await sql`
      SELECT seat_row, seat_number 
      FROM tickets 
      WHERE showtime_id = ${id}
    `
    
    return NextResponse.json(occupiedSeats)
  } catch (error) {
    console.error('Error fetching occupied seats:', error)
    return NextResponse.json({ error: 'Error fetching seats' }, { status: 500 })
  }
}
