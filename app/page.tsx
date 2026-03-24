import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { MovieCard } from '@/components/movie-card'
import { sql, Movie } from '@/lib/db'
import { Film } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const revalidate = 60

async function getMovies(): Promise<Movie[]> {
  const movies = await sql`
    SELECT * FROM movies 
    WHERE is_active = true OR is_active IS NULL
    ORDER BY release_date DESC
  `
  return movies as Movie[]
}

export default async function HomePage() {
  const movies = await getMovies()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        {/* Cartelera Section */}
        <section id="cartelera" className="container mx-auto px-4 py-16">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Cartelera
              </h2>
              <p className="text-muted-foreground">
                Descubre las películas que tenemos para ti
              </p>
            </div>
          </div>

          {movies.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <Film className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No hay películas disponibles</p>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="border-t border-border/50 bg-card/50">
          <div className="container mx-auto px-4 py-16">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Reserva Fácil</h3>
                <p className="text-muted-foreground">
                  Selecciona tu película, elige tus asientos y paga en segundos. Todo desde tu dispositivo.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Tiquete Digital</h3>
                <p className="text-muted-foreground">
                  Recibe tu código único de entrada. Sin filas, sin complicaciones.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cinema-green/10">
                  <svg className="h-6 w-6 text-cinema-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Experiencia Premium</h3>
                <p className="text-muted-foreground">
                  Salas con la mejor tecnología de audio y video para una experiencia inolvidable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Film className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">CinePlex</span>
              </div>
              <p className="text-sm text-muted-foreground">
                2026 CinePlex. Sistema de Gestión de Cine.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
