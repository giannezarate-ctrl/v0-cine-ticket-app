import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    // Enable UUID extension
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`

    // Drop old tables if they exist (optional - comment out if you want to keep data)
    await sql`DROP TABLE IF EXISTS ticket_seats CASCADE`
    await sql`DROP TABLE IF EXISTS tickets CASCADE`
    await sql`DROP TABLE IF EXISTS showtime_seats CASCADE`
    await sql`DROP TABLE IF EXISTS showtimes CASCADE`
    await sql`DROP TABLE IF EXISTS seats CASCADE`
    await sql`DROP TABLE IF EXISTS rooms CASCADE`
    await sql`DROP TABLE IF EXISTS movies CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Create users table
    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'client')),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create movies table
    await sql`
      CREATE TABLE movies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        duration INT,
        rating VARCHAR(10),
        synopsis TEXT,
        poster_url TEXT,
        trailer_url TEXT,
        release_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create rooms table
    await sql`
      CREATE TABLE rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        capacity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create seats table
    await sql`
      CREATE TABLE seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        row CHAR(1),
        number INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create showtimes table
    await sql`
      CREATE TABLE showtimes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
        room_id UUID REFERENCES rooms(id),
        start_time TIMESTAMP NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create showtime_seats table
    await sql`
      CREATE TABLE showtime_seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        showtime_id UUID REFERENCES showtimes(id) ON DELETE CASCADE,
        seat_id UUID REFERENCES seats(id),
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
        UNIQUE (showtime_id, seat_id)
      )
    `

    // Create tickets table
    await sql`
      CREATE TABLE tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        showtime_id UUID REFERENCES showtimes(id),
        code VARCHAR(50) UNIQUE NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create ticket_seats table
    await sql`
      CREATE TABLE ticket_seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        seat_id UUID REFERENCES seats(id)
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_movies_active ON movies(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms ON rooms(id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_seats_room ON seats(room_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON showtimes(movie_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_showtimes_room ON showtimes(room_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_showtimes_start ON showtimes(start_time)`
    await sql`CREATE INDEX IF NOT EXISTS idx_showtime_seats_showtime ON showtime_seats(showtime_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id)`

    // Insert sample rooms with seats
    const rooms = [
      { name: 'Sala 1', capacity: 60 },
      { name: 'Sala 2', capacity: 60 },
      { name: 'Sala 3', capacity: 40 },
    ]

    for (const room of rooms) {
      const [roomResult] = await sql`
        INSERT INTO rooms (name, capacity)
        VALUES (${room.name}, ${room.capacity})
        RETURNING id
      `
      
      // Create seats for each room (10 rows x 6 seats for Sala 1 & 2, 10 rows x 4 seats for Sala 3)
      const seatsPerRow = room.name === 'Sala 3' ? 4 : 6
      const rows = 10
      
      for (let r = 1; r <= rows; r++) {
        const rowLetter = String.fromCharCode(64 + r) // A, B, C, etc.
        for (let s = 1; s <= seatsPerRow; s++) {
          await sql`
            INSERT INTO seats (room_id, row, number)
            VALUES (${roomResult.id}, ${rowLetter}, ${s})
          `
        }
      }
    }

    // Insert sample movies
    const movies = [
      { 
        title: 'Dune: Parte Dos', 
        genre: 'Ciencia Ficción', 
        duration: 166, 
        rating: 'PG-13', 
        synopsis: 'Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
        poster_url: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
        release_date: '2024-03-01'
      },
      { 
        title: 'Oppenheimer', 
        genre: 'Drama', 
        duration: 180, 
        rating: 'R', 
        synopsis: 'La historia del científico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.',
        poster_url: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        release_date: '2023-07-21'
      },
      { 
        title: 'Spider-Man: Across the Spider-Verse', 
        genre: 'Animación', 
        duration: 140, 
        rating: 'PG', 
        synopsis: 'Miles Morales regresa para una épica aventura que transportará al amigable vecino de Brooklyn a través del Multiverso.',
        poster_url: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        release_date: '2023-06-02'
      },
      { 
        title: 'Wonka', 
        genre: 'Fantasía', 
        duration: 116, 
        rating: 'PG', 
        synopsis: 'Basada en el personaje de Roald Dahl, cuenta la historia de cómo Willy Wonka se convirtió en el famoso chocolatero.',
        poster_url: 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg',
        release_date: '2023-12-15'
      },
      { 
        title: 'Kung Fu Panda 4', 
        genre: 'Animación', 
        duration: 94, 
        rating: 'PG', 
        synopsis: 'Po debe entrenar a un nuevo guerrero mientras enfrenta a una villana que puede convocar espíritus de maestros caídos.',
        poster_url: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
        release_date: '2024-03-08'
      },
      { 
        title: 'Godzilla x Kong: El Nuevo Imperio', 
        genre: 'Acción', 
        duration: 115, 
        rating: 'PG-13', 
        synopsis: 'Godzilla y Kong deben unirse contra una amenaza colosal escondida en nuestro mundo.',
        poster_url: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
        release_date: '2024-03-29'
      },
    ]

    for (const movie of movies) {
      await sql`
        INSERT INTO movies (title, genre, duration, rating, synopsis, poster_url, release_date, is_active)
        VALUES (${movie.title}, ${movie.genre}, ${movie.duration}, ${movie.rating}, ${movie.synopsis}, ${movie.poster_url}, ${movie.release_date}, true)
      `
    }

    // Get all movies and rooms to create showtimes
    const allMovies = await sql`SELECT id FROM movies`
    const allRooms = await sql`SELECT id, name FROM rooms`

    // Create showtimes for next 7 days
    for (const movie of allMovies) {
      for (const room of allRooms) {
        // Create showtimes at 14:00, 17:00, 20:00, 22:30
        const times = ['14:00', '17:00', '20:00', '22:30']
        
        for (let day = 0; day < 7; day++) {
          for (const time of times) {
            const startTime = new Date()
            startTime.setDate(startTime.getDate() + day)
            const [hours, minutes] = time.split(':')
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            const price = room.name === 'Sala 3' ? 18000 : 15000

            await sql`
              INSERT INTO showtimes (movie_id, room_id, start_time, price)
              VALUES (${movie.id}, ${room.id}, ${startTime.toISOString()}, ${price})
            `
          }
        }
      }
    }

    // Create all showtime_seats (all seats available initially)
    const allShowtimes = await sql`SELECT id FROM showtimes`
    const allSeats = await sql`SELECT id, room_id FROM seats`

    for (const showtime of allShowtimes) {
      for (const seat of allSeats) {
        await sql`
          INSERT INTO showtime_seats (showtime_id, seat_id, status)
          VALUES (${showtime.id}, ${seat.id}, 'available')
        `
      }
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await sql`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Administrador', 'admin@gmail.com', ${hashedPassword}, 'admin', '3001234567')
    `

    // Create test user
    const hashedPasswordTest = await bcrypt.hash('test123', 10)
    await sql`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Usuario Prueba', 'test@test.com', ${hashedPasswordTest}, 'client', '3009876543')
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente con UUIDs. Admin: admin@gmail.com / admin123' 
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al inicializar la base de datos' 
    }, { status: 500 })
  }
}