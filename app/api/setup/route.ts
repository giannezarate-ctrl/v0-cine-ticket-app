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

    // Insert sample rooms and collect IDs
    const rooms = [
      { name: 'Sala 1', capacity: 60 },
      { name: 'Sala 2', capacity: 60 },
      { name: 'Sala 3', capacity: 40 },
    ]
    const roomIds: Record<string, string> = {}
    for (const room of rooms) {
      const [roomResult] = await sql`
        INSERT INTO rooms (name, capacity)
        VALUES (${room.name}, ${room.capacity})
        RETURNING id
      `
      roomIds[room.name] = roomResult.id
      
      // Create seats for each room using batch insertion (UNNEST) for efficiency
      const seatsPerRow = room.name === 'Sala 3' ? 4 : 6
      const rowsCount = 10
      const rows = []
      const nums = []
      
      for (let r = 1; r <= rowsCount; r++) {
        const rowLetter = String.fromCharCode(64 + r)
        for (let s = 1; s <= seatsPerRow; s++) {
          rows.push(rowLetter)
          nums.push(s)
        }
      }

      await sql`
        INSERT INTO seats (room_id, row, number)
        SELECT ${roomResult.id}, row_letter, seat_num
        FROM UNNEST(${rows}::text[], ${nums}::int[]) AS t(row_letter, seat_num)
      `

    }

    // Insert sample movies
    const moviesData = [
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
        title: 'Barbie', 
        genre: 'Comedia', 
        duration: 114, 
        rating: 'PG-13', 
        synopsis: 'Barbiedoll vive en Barbieland, pero cuando decide salir del mundo perfecto, descubre lo que hay más allá.',
        poster_url: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfziGlbLJXrFSo.jpg',
        release_date: '2023-07-21'
      },
      { 
        title: 'The Batman', 
        genre: 'Acción', 
        duration: 176, 
        rating: 'PG-13', 
        synopsis: 'Batman persigue a una serie de asesinos en serie en Gotham City durante dos años.',
        poster_url: 'https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg',
        release_date: '2022-03-04'
      },
      { 
        title: 'Top Gun: Maverick', 
        genre: 'Acción', 
        duration: 131, 
        rating: 'PG-13', 
        synopsis: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator.',
        poster_url: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DG35MPB.jpg',
        release_date: '2022-05-27'
      },
      { 
        title: 'Avatar: El Camino del Agua', 
        genre: 'Ciencia Ficción', 
        duration: 192, 
        rating: 'PG-13', 
        synopsis: 'Jake Sully vive con su familia expandida en Pandora. Cuando una amenaza conocida vuelve, deben unirse para proteger su hogar.',
        poster_url: 'https://image.tmdb.org/t/p/w500/tNa9C4NpY9PsbZMeHwLVCfIXrjD.jpg',
        release_date: '2022-12-16'
      },
      { 
        title: 'Black Panther: Wakanda Forever', 
        genre: 'Acción', 
        duration: 161, 
        rating: 'PG-13', 
        synopsis: 'Los habitantes de Wakanda luchan por proteger su nación después de la muerte del Rey TChalla.',
        poster_url: 'https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALP1Jq3fsg0UHU5.jpg',
        release_date: '2022-11-11'
      },
      { 
        title: 'John Wick: Capítulo 4', 
        genre: 'Acción', 
        duration: 169, 
        rating: 'R', 
        synopsis: 'John Wick busca la manera de obtener su libertad definitiva pero el Alto Table lo pone un precio muy alto.',
        poster_url: 'https://image.tmdb.org/t/p/w500/vZLoQ3DIXd9G2t8j3zPJf3X6IKT.jpg',
        release_date: '2023-03-24'
      },
      { 
        title: 'Guardians of the Galaxy Vol. 3', 
        genre: 'Ciencia Ficción', 
        duration: 149, 
        rating: 'PG-13', 
        synopsis: 'Still reeling from Rocket’s devastating injury, the Guardians must fight to protect Rocket.',
        poster_url: 'https://image.tmdb.org/t/p/w500/r2dfM4jgjNQyD3BK6bvzPrdXFDB.jpg',
        release_date: '2023-05-05'
      },
      { 
        title: 'La sirenita', 
        genre: 'Familia', 
        duration: 135, 
        rating: 'PG', 
        synopsis: 'Una joven sirena quiere explorar el mundo humano y se hace amiga de un príncipe.',
        poster_url: 'https://image.tmdb.org/t/p/w500/2w7lJ9l7oX0rug3i8VfJhTqgMiS.jpg',
        release_date: '2023-05-26'
      },
      { 
        title: 'Transformers: El despertar de las bestias', 
        genre: 'Ciencia Ficción', 
        duration: 127, 
        rating: 'PG-13', 
        synopsis: 'Durante una expedición arqueológica, los Maximals se unen a los Autobots para proteger la Tierra.',
        poster_url: 'https://image.tmdb.org/t/p/w500/gPbM0MK8Ej8SVTHYce2Hk4pgdbr.jpg',
        release_date: '2023-06-09'
      }
    ]

    for (const movie of moviesData) {
      await sql`
        INSERT INTO movies (title, genre, duration, rating, synopsis, poster_url, release_date, is_active)
        VALUES (${movie.title}, ${movie.genre}, ${movie.duration}, ${movie.rating}, ${movie.synopsis}, ${movie.poster_url}, ${movie.release_date}, true)
      `
    }

    // Get all movies and rooms
    const allMovies = await sql`SELECT id FROM movies`
    const allRooms = await sql`SELECT id, name FROM rooms`

    // Create showtimes with different schedules per room (Optimized)
    for (const movie of allMovies) {
      for (const room of allRooms) {
        // Different schedules for different rooms
        let times: string[]
        if (room.name === 'Sala 1') {
          times = ['10:00', '13:00', '16:00', '19:00', '22:00'] // Morning/Afternoon movies
        } else if (room.name === 'Sala 2') {
          times = ['11:30', '14:30', '17:30', '20:30', '23:00'] // Mid-day schedule
        } else {
          times = ['12:00', '15:00', '18:00', '21:00', '23:30'] // Evening/Night movies
        }
        
        for (let day = 0; day < 14; day++) { // 14 dias de funciones
          for (const time of times) {
            const startTime = new Date()
            startTime.setDate(startTime.getDate() + day)
            const [hours, minutes] = time.split(':')
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            const price = room.name === 'Sala 3' ? 18000 : 15000

            const [showtime] = await sql`
              INSERT INTO showtimes (movie_id, room_id, start_time, price)
              VALUES (${movie.id}, ${room.id}, ${startTime.toISOString()}, ${price})
              RETURNING id
            `

            // Batch insert showtime_seats ONLY for seats in this room
            await sql`
              INSERT INTO showtime_seats (showtime_id, seat_id, status)
              SELECT ${showtime.id}, id, 'available'
              FROM seats
              WHERE room_id = ${room.id}
            `
          }
        }
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