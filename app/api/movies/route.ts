import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const movies = await sql`
      SELECT * FROM movies 
      WHERE is_active = true OR is_active IS NULL
      ORDER BY release_date DESC
    `
    return NextResponse.json(movies)
  } catch (error) {
    console.error('Error fetching movies:', error)
    return NextResponse.json({ error: 'Error fetching movies' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, genre, duration, rating, synopsis, poster_url, trailer_url, release_date } = body
    
    const result = await sql`
      INSERT INTO movies (title, genre, duration, rating, synopsis, poster_url, trailer_url, release_date, is_active)
      VALUES (${title}, ${genre}, ${duration}, ${rating}, ${synopsis}, ${poster_url}, ${trailer_url}, ${release_date}, true)
      RETURNING id, title, genre, duration, rating, synopsis, poster_url, trailer_url, release_date, is_active, created_at
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating movie:', error)
    return NextResponse.json({ error: 'Error creating movie' }, { status: 500 })
  }
}
