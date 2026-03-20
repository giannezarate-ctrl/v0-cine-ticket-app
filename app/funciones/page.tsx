"use client"

import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'

interface Movie {
  id: number
  title: string
  genre: string
  duration: number
  classification: string
  synopsis: string
  director: string
  cast: string
  image_url: string
  trailer_url: string | null
  release_date: string
  is_active: boolean
}

interface Showtime {
  id: number
  movie_id: number
  room_id: number
  date: string
  time: string
  price: number
  is_active: boolean
  room_name?: string
  movie?: Movie
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(price)
}

export default function FuncionesPage() {
  const { data: showtimes, isLoading: loadingShowtimes } = useSWR<Showtime[]>('/api/showtimes', fetcher)
  const { data: movies, isLoading: loadingMovies } = useSWR<Movie[]>('/api/movies', fetcher)

  const isLoading = loadingShowtimes || loadingMovies

  // Group functions by date
  const showtimesByDate = (showtimes || []).reduce((acc, showtime) => {
    const dateKey = showtime.date.split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(showtime)
    return acc
  }, {} as Record<string, Showtime[]>)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getMovie = (movieId: number) => {
    return movies?.find(m => m.id === movieId)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">Programacion</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Todas las Funciones
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Explora todas las funciones disponibles organizadas por fecha. Selecciona la que mas te convenga y reserva tus asientos.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        )}

        {/* Functions by Date */}
        {!isLoading && (
          <div className="space-y-12">
            {Object.entries(showtimesByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dateShowtimes]) => (
              <section key={date}>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold capitalize text-foreground">
                    {formatDate(date)}
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dateShowtimes.map((showtime) => {
                    const movie = getMovie(showtime.movie_id)
                    if (!movie) return null

                    return (
                      <Card key={showtime.id} className="group overflow-hidden border-border bg-card transition-all hover:border-primary/50">
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            {/* Movie Poster */}
                            <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                              <Image
                                src={movie.image_url}
                                alt={movie.title}
                                fill
                                className="object-cover"
                              />
                            </div>

                            {/* Function Details */}
                            <div className="flex flex-1 flex-col justify-between">
                              <div>
                                <h3 className="mb-1 line-clamp-1 font-semibold text-foreground">
                                  {movie.title}
                                </h3>
                                <div className="mb-2 flex flex-wrap gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {movie.classification}
                                  </Badge>
                                  <Badge variant="outline" className="border-border text-xs">
                                    {movie.genre}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {showtime.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {showtime.room_name || `Sala ${showtime.room_id}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
                            <span className="text-lg font-bold text-cinema-gold">
                              {formatPrice(showtime.price)}
                            </span>
                            <Link href={`/pelicula/${movie.id}`}>
                              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <Ticket className="mr-2 h-4 w-4" />
                                Comprar
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            ))}

            {Object.keys(showtimesByDate).length === 0 && (
              <div className="py-20 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No hay funciones programadas</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
