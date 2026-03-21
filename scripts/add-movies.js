const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_KWZJ2jx4eplz@ep-late-lab-acde9nwt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
})

const movies = [
  ["Avatar: El Camino del Agua", "Jake Sully vive con su nueva familia en los planetas Pandora. Cuando una amenaza antigua regresa, debe proteger su hogar.", 192, "Ciencia Ficcion", "PG-13", "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", "2022-12-16"],
  ["The Batman", "En su segundo año como Batman, Bruce Wayne se enfrenta a un asesino en serie que atormenta a Gotham.", 176, "Accion", "PG-13", "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9r3jtvyqZaC.jpg", "2022-03-04"],
  ["Barbie", "Barbie y Ken estan disfrutando de su vida en Barbieland, pero comienzan a cuestionar su existencia.", 114, "Comedia", "PG-13", "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", "2023-07-21"],
  ["Top Gun: Maverick", "Despues de mas de 30 anos como piloto, Maverick debe entrenar a un grupo de graduados.", 131, "Accion", "PG-13", "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DG35MPv.jpg", "2022-05-27"],
  ["Super Mario Bros. La Pelicula", "Mario y Luigi descubren el Reino Champiñon y deben derrotar a Bowser.", 92, "Animacion", "PG", "https://image.tmdb.org/t/p/w500/wKU8R3sD3Fz2DprLU2C0e6y2bN.jpg", "2023-04-07"],
  ["Interestelar", "Un equipo de exploradores Viaja a traves de un agujero de gusano en el espacio.", 169, "Ciencia Ficcion", "PG-13", "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "2014-11-07"],
  ["El Padrino", "La saga de la familia Corleone desde los anos 50 hasta principios de los 60.", 175, "Drama", "R", "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", "1972-03-15"],
  ["Titanic", "Una joven de alta sociedad y un artista pobre se enamoran a bordo del RMS Titanic.", 195, "Drama", "PG-13", "https://image.tmdb.org/t/p/w500/9Xw0I9pM8K1k6z3w7r9qE0r4t0E.jpg", "1997-12-19"],
  ["Harry Potter y la Piedra Filosofal", "Harry Potter descubre que es un mago y comienza su educacion en Hogwarts.", 152, "Fantasia", "PG", "https://image.tmdb.org/t/p/w500/wuMc08IPIOt8sjC9ZFBQnN8kxz2.jpg", "2001-11-16"],
  ["Vingadores: Endgame", "Los Vengadores se reunen una vez mas para deshacer los danos de Thanos.", 181, "Accion", "PG-13", "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", "2019-04-26"],
  ["El Rey Leon", "Simba, un joven leon, debe tomar su lugar como rey despues de la muerte de su padre.", 88, "Animacion", "G", "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsdP5.jpg", "1994-06-24"],
  ["Matrix", "Un hacker descubre la verdad sobre su realidad y se une a la rebelion.", 136, "Ciencia Ficcion", "R", "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "1999-03-31"]
]

async function addMovies() {
  await client.connect()
  
  for (const movie of movies) {
    await client.query(
      `INSERT INTO movies (title, synopsis, duration, genre, rating, poster_url, release_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      movie
    )
    console.log(`Added: ${movie[0]}`)
  }
  
  await client.end()
  console.log('All movies added!')
}

addMovies().catch(console.error)
