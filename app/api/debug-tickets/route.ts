import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const tickets = await sql`SELECT code, status FROM tickets LIMIT 5`
    return NextResponse.json({ tickets })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
