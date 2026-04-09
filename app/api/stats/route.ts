import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const moviesCount = await sql`SELECT COUNT(*) as count FROM movies WHERE is_active = true OR is_active IS NULL`
    const ticketsToday = await sql`
      SELECT COUNT(*) as count FROM tickets 
      WHERE DATE(created_at) = CURRENT_DATE
    `
    const totalRevenue = await sql`
      SELECT COALESCE(SUM(total), 0) as total
      FROM tickets t
      WHERE t.status != 'cancelled'
    `
    const showtimesToday = await sql`
      SELECT COUNT(*) as count FROM showtimes 
      WHERE DATE(start_time) = CURRENT_DATE
    `
    
    const recentTickets = await sql`
      SELECT 
        t.*, 
        m.title as movie_title, 
        s.start_time, 
        r.name as room_name,
        u.name as customer_name,
        st.row as seat_row,
        st.number as seat_number
      FROM tickets t
      JOIN showtimes s ON t.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN ticket_seats ts ON t.id = ts.ticket_id
      LEFT JOIN seats st ON ts.seat_id = st.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `
    
    const salesByMovie = await sql`
      SELECT m.title, COUNT(t.id) as tickets_sold, SUM(t.total) as revenue
      FROM movies m
      JOIN showtimes s ON m.id = s.movie_id
      JOIN tickets t ON s.id = t.showtime_id
      WHERE t.status != 'cancelled'
      GROUP BY m.id, m.title
      ORDER BY tickets_sold DESC
      LIMIT 5
    `
    
    // Map to compatibility fields
    const mappedRecentTickets = recentTickets.map((t: any) => ({
      ...t,
      ticket_code: t.code,
      is_validated: t.status === 'used'
    }))

    
    return NextResponse.json({
      moviesCount: moviesCount[0].count,
      ticketsToday: ticketsToday[0].count,
      totalRevenue: totalRevenue[0].total,
      showtimesToday: showtimesToday[0].count,
      recentTickets: mappedRecentTickets,
      salesByMovie
    })

  } catch (error) {
    console.error('ERROR STATS:', error)
    return NextResponse.json({
      moviesCount: 0,
      ticketsToday: 0,
      totalRevenue: 0,
      showtimesToday: 0,
      recentTickets: [],
      salesByMovie: []
    }, { status: 200 })
  }
}
