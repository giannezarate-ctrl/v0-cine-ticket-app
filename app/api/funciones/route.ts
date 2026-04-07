import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const showtimes = await sql`
      SELECT 
        s.id,
        s.movie_id,
        s.room_id,
        s.start_time,
        s.price,
        r.name as room_name,
        m.id as m_id,
        m.title as m_title,
        m.genre as m_genre,
        m.duration as m_duration,
        m.rating as m_rating,
        m.synopsis as m_synopsis,
        m.poster_url as m_poster_url,
        m.trailer_url as m_trailer_url,
        m.release_date as m_release_date,
        m.is_active as m_is_active
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      WHERE (m.is_active = true OR m.is_active IS NULL) AND s.start_time >= CURRENT_DATE
      ORDER BY s.start_time
    `
    
    // Map to include date and time fields for the frontend
    const mapped = showtimes.map((s: any) => {
      const dt = new Date(s.start_time)
      return {
        ...s,
        date: dt.toISOString().split('T')[0],
        time: dt.toTimeString().slice(0, 5)
      }
    })

    console.log('FUNCIONES:', mapped)
    
    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })

  } catch (error) {
    console.error('ERROR FUNCIONES:', error)
    return NextResponse.json([], { status: 200 })
  }
}
