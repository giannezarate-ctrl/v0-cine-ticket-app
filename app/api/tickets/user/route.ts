import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tickets = await sql`
      SELECT 
        t.id,
        t.code as codigo,
        t.total as precio,
        t.status as estado,
        t.created_at as purchase_date,
        s.start_time as show_time,
        m.title as movie_title,
        m.poster_url as movie_poster,
        r.name as room_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('row', s2.row, 'number', s2.number)
          ) FILTER (WHERE s2.id IS NOT NULL),
          '[]'::json
        ) as seats
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      LEFT JOIN movies m ON s.movie_id = m.id
      LEFT JOIN rooms r ON s.room_id = r.id
      LEFT JOIN ticket_seats ts ON t.id = ts.ticket_id
      LEFT JOIN seats s2 ON ts.seat_id = s2.id
      WHERE t.user_id = ${user.id}
      GROUP BY t.id, s.start_time, m.title, m.poster_url, r.name
      ORDER BY t.created_at DESC
    `

    // Format show_date from start_time
    const formattedTickets = tickets.map((t: any) => ({
      ...t,
      show_date: t.show_time ? new Date(t.show_time).toISOString().split('T')[0] : null
    }))

    return NextResponse.json(formattedTickets)
  } catch (error) {
    console.error('Error fetching user tickets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}