import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Mostrar películas que están activas o no tienen estado definido
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
    const { action, title, genre, duration, rating, synopsis, poster_url, trailer_url, release_date } = body
    
    // Si es la acción de seed, agregar películas de prueba
    if (action === 'seed') {
      const movies = [
        { title: 'Avatar: El Camino del Agua', synopsis: 'Jake Sully vive con su nueva familia en los planetas Pandora.', duration: 192, genre: 'Ciencia Ficción', rating: 'PG-13', poster_url: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', release_date: '2024-12-16' },
        { title: 'The Batman', synopsis: 'En su segundo año como Batman, Bruce Wayne se enfrenta a un asesino en serie.', duration: 176, genre: 'Acción', rating: 'PG-13', poster_url: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9r3jtvyqZaC.jpg', release_date: '2024-03-04' },
        { title: 'Barbie', synopsis: 'Barbie y Ken disfrutan de su vida en Barbieland, pero beginzan a cuestionar su existencia.', duration: 114, genre: 'Comedia', rating: 'PG-13', poster_url: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', release_date: '2024-07-21' },
        { title: 'Top Gun: Maverick', synopsis: 'Después de más de 30 años como piloto, Maverick debe entrenar a un grupo de graduados.', duration: 131, genre: 'Acción', rating: 'PG-13', poster_url: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DG35MPv.jpg', release_date: '2024-05-27' },
        { title: 'Super Mario Bros. La Película', synopsis: 'Mario y Luigi descubren el Reino Champiñon y deben derrotar a Bowser.', duration: 92, genre: 'Animación', rating: 'PG', poster_url: 'https://image.tmdb.org/t/p/w500/wKU8R3sD3Fz2DprLU2C0e6y2bN.jpg', release_date: '2024-04-07' },
      ]
      
      const inserted = []
      for (const m of movies) {
        try {
          const result = await sql`
            INSERT INTO movies (title, synopsis, duration, genre, rating, poster_url, release_date, is_active)
            VALUES (${m.title}, ${m.synopsis}, ${m.duration}, ${m.genre}, ${m.rating}, ${m.poster_url}, ${m.release_date}, true)
            RETURNING *
          `
          inserted.push(result[0])
        } catch (e) {
          // La película ya existe, continuar
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${inserted.length} películas agregadas`,
        movies: inserted 
      })
    }
    
    // Crear una nueva película
    const result = await sql`
      INSERT INTO movies (title, genre, duration, rating, synopsis, poster_url, trailer_url, release_date, is_active)
      VALUES (${title}, ${genre}, ${duration}, ${rating}, ${synopsis}, ${poster_url}, ${trailer_url}, ${release_date}, true)
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating movie:', error)
    return NextResponse.json({ error: 'Error creating movie' }, { status: 500 })
  }
}
