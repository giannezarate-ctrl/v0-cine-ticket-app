import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    // Create users table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `
    
    // Check if admin user exists
    const existingAdmin = await sql`
      SELECT id FROM users WHERE email = 'admin@gmail.com'
    `
    
    // Insert default admin user if not exists (password: admin123)
    if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
      
      await sql`
        INSERT INTO users (name, email, password_hash, role, phone)
        VALUES ('Administrador', 'admin@gmail.com', ${hashedPassword}, 'admin', '3001234567')
      `
    }
    
    // Check if test user exists
    const existingTest = await sql`
      SELECT id FROM users WHERE email = 'test@test.com'
    `
    
    // Insert test user if not exists (password: test123)
    if (existingTest.length === 0) {
      const hashedPassword = await bcrypt.hash('test123', 10)
      
      await sql`
        INSERT INTO users (name, email, password_hash, role, phone)
        VALUES ('Usuario Prueba', 'test@test.com', ${hashedPassword}, 'client', '3009876543')
      `
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente. Admin: admin@gmail.com / admin123' 
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al inicializar la base de datos' 
    }, { status: 500 })
  }
}