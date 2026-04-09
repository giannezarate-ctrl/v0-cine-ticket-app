import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const rooms = await sql`SELECT id, name, capacity FROM rooms`
    let totalInserted = 0

    console.log('[Fix Seats] Starting seat synchronization...')

    for (const room of rooms) {
      const seatsPerRow = room.name === 'Sala 3' ? 4 : 6
      const rowsCount = 10
      
      for (let r = 1; r <= rowsCount; r++) {
        const rowLetter = String.fromCharCode(64 + r)
        for (let s = 1; s <= seatsPerRow; s++) {
          // Check if seat exists
          const existing = await sql`
            SELECT id FROM seats 
            WHERE room_id = ${room.id} AND row = ${rowLetter} AND number = ${s}
          `
          if (existing.length === 0) {
            await sql`
              INSERT INTO seats (room_id, row, number)
              VALUES (${room.id}, ${rowLetter}, ${s})
            `
            totalInserted++
          }
        }
      }
    }

    // After inserting seats, ensure ALL showtimes have entries in showtime_seats for ALL seats in their room
    const showtimeSeatsResult = await sql`
      INSERT INTO showtime_seats (showtime_id, seat_id, status)
      SELECT s.id, st.id, 'available'
      FROM showtimes s
      JOIN seats st ON s.room_id = st.room_id
      LEFT JOIN showtime_seats ss ON s.id = ss.showtime_id AND st.id = ss.seat_id
      WHERE ss.id IS NULL
      RETURNING id
    `

    return NextResponse.json({ 
      success: true, 
      message: `Asientos sincronizados exitosamente.`,
      details: {
        seatsInserted: totalInserted,
        showtimeSeatsCreated: showtimeSeatsResult.length
      }
    })
  } catch (error) {
    console.error('[Fix Seats] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}
