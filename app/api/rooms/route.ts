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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, capacity } = body

    if (!name || !capacity) {
      return NextResponse.json(
        { error: 'Nombre y capacidad son requeridos' },
        { status: 400 }
      )
    }

    // Create room
    const [room] = await sql`
      INSERT INTO rooms (name, capacity)
      VALUES (${name}, ${capacity})
      RETURNING id, name, capacity, created_at
    `

    // Create seats for the room (10 rows x 6 seats by default)
    const rows = 10
    const seatsPerRow = 6
    
    for (let r = 1; r <= rows; r++) {
      const rowLetter = String.fromCharCode(64 + r) // A, B, C, etc.
      for (let s = 1; s <= seatsPerRow; s++) {
        await sql`
          INSERT INTO seats (room_id, row, number)
          VALUES (${room.id}, ${rowLetter}, ${s})
        `
      }
    }

    // Get all seats for this room
    const seats = await sql`
      SELECT id, row, number FROM seats 
      WHERE room_id = ${room.id}
      ORDER BY row, number
    `

    return NextResponse.json({ ...room, seats }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Error creating room' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, capacity } = body

    if (!id || !name || !capacity) {
      return NextResponse.json(
        { error: 'ID, nombre y capacidad son requeridos' },
        { status: 400 }
      )
    }

    const [room] = await sql`
      UPDATE rooms 
      SET name = ${name}, capacity = ${capacity}
      WHERE id = ${id}
      RETURNING id, name, capacity, created_at
    `

    if (!room) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Error updating room' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Delete room (seats will be deleted automatically due to CASCADE)
    const [room] = await sql`
      DELETE FROM rooms WHERE id = ${id}
      RETURNING id
    `

    if (!room) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Error deleting room' }, { status: 500 })
  }
}
