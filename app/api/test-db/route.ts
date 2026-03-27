import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test database connection
    const result = await sql`SELECT 1 as test`
    
    // Test if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    // Test showtimes table
    const showtimesCount = await sql`SELECT COUNT(*) as count FROM showtimes`
    
    // Test movies table
    const moviesCount = await sql`SELECT COUNT(*) as count FROM movies`
    
    // Test rooms table
    const roomsCount = await sql`SELECT COUNT(*) as count FROM rooms`
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      tables: tables.map(t => t.table_name),
      counts: {
        showtimes: showtimesCount[0].count,
        movies: moviesCount[0].count,
        rooms: roomsCount[0].count
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
