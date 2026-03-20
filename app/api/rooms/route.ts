import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rooms = await sql`SELECT * FROM rooms ORDER BY name`
    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Error fetching rooms' }, { status: 500 })
  }
}
