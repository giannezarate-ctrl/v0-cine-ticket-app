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
    
    // Create movies table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        duration INTEGER NOT NULL,
        rating VARCHAR(20),
        synopsis TEXT,
        poster_url TEXT,
        trailer_url TEXT,
        release_date DATE,
        score DECIMAL(3,1) DEFAULT 8.0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create rooms table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        rows_count INTEGER NOT NULL DEFAULT 10,
        seats_per_row INTEGER NOT NULL DEFAULT 15,
        total_seats INTEGER GENERATED ALWAYS AS (rows_count * seats_per_row) STORED
      )
    `
    
    // Create showtimes table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS showtimes (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        show_date DATE NOT NULL,
        show_time TIME NOT NULL,
        price INTEGER NOT NULL DEFAULT 12000,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create tickets table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        showtime_id INTEGER REFERENCES showtimes(id) ON DELETE CASCADE,
        seat_row VARCHAR(2) NOT NULL,
        seat_number INTEGER NOT NULL,
        ticket_code VARCHAR(20) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        purchase_date TIMESTAMP DEFAULT NOW(),
        is_validated BOOLEAN DEFAULT false,
        validated_at TIMESTAMP,
        UNIQUE(showtime_id, seat_row, seat_number)
      )
    `
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_showtimes_date ON showtimes(show_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON showtimes(movie_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_showtime ON tickets(showtime_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code)`
    
    // Check if rooms exist, if not insert default rooms
    const existingRooms = await sql`SELECT id FROM rooms`
    if (existingRooms.length === 0) {
      await sql`
        INSERT INTO rooms (name, rows_count, seats_per_row) VALUES
        ('Sala 1', 10, 15),
        ('Sala 2', 10, 15),
        ('Sala 3', 10, 15)
      `
    }
    
    // Check if movies exist, if not insert sample movies
    const existingMovies = await sql`SELECT id FROM movies`
    if (existingMovies.length === 0) {
      await sql`
        INSERT INTO movies (title, synopsis, duration, genre, rating, poster_url, release_date, score) VALUES
        ('Dune: Parte Dos', 'Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.', 166, 'Ciencia Ficcion', 'PG-13', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg', '2024-03-01', 8.8),
        ('Oppenheimer', 'La historia del cientifico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atomica.', 180, 'Drama', 'R', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', '2023-07-21', 8.9),
        ('Spider-Man: Across the Spider-Verse', 'Miles Morales regresa para una epica aventura que transportara al amigable vecino de Brooklyn a traves del Multiverso.', 140, 'Animacion', 'PG', 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', '2023-06-02', 8.7),
        ('Wonka', 'Basada en el personaje de Roald Dahl, cuenta la historia de como Willy Wonka se convirtio en el famoso chocolatero.', 116, 'Fantasia', 'PG', 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg', '2023-12-15', 7.5),
        ('Kung Fu Panda 4', 'Po debe entrenar a un nuevo guerrero mientras enfrenta a una villana que puede convocar espiritus de maestros caidos.', 94, 'Animacion', 'PG', 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', '2024-03-08', 7.2),
        ('Godzilla x Kong: El Nuevo Imperio', 'Godzilla y Kong deben unirse contra una amenaza colosal escondida en nuestro mundo.', 115, 'Accion', 'PG-13', 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg', '2024-03-29', 7.8)
      `
    }
    
    // Check if showtimes exist, if not insert sample showtimes
    const existingShowtimes = await sql`SELECT id FROM showtimes`
    if (existingShowtimes.length === 0) {
      await sql`
        INSERT INTO showtimes (movie_id, room_id, show_date, show_time, price)
        SELECT 
          m.id,
          r.id,
          CURRENT_DATE + (d.day_offset || ' days')::INTERVAL,
          t.hora::TIME,
          15000
        FROM movies m
        CROSS JOIN rooms r
        CROSS JOIN (VALUES (0), (1), (2), (3), (4), (5), (6)) AS d(day_offset)
        CROSS JOIN (VALUES ('14:00'), ('17:00'), ('20:00'), ('22:30')) AS t(hora)
        WHERE m.is_active = true
      `
    }
    
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