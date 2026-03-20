import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movies = await sql`
      SELECT * FROM movies WHERE id = ${id}
    `
    
    if (movies.length === 0) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }
    
    return NextResponse.json(movies[0])
  } catch (error) {
    console.error('Error fetching movie:', error)
    return NextResponse.json({ error: 'Error fetching movie' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, genre, duration, rating, synopsis, poster_url, trailer_url, release_date, is_active } = body
    
    const result = await sql`
      UPDATE movies 
      SET title = ${title}, genre = ${genre}, duration = ${duration}, 
          rating = ${rating}, synopsis = ${synopsis}, poster_url = ${poster_url},
          trailer_url = ${trailer_url}, release_date = ${release_date}, is_active = ${is_active}
      WHERE id = ${id}
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating movie:', error)
    return NextResponse.json({ error: 'Error updating movie' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await sql`DELETE FROM movies WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Error deleting movie' }, { status: 500 })
  }
}
