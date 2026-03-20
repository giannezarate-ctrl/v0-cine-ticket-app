'use client'

import { use, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { SeatSelector } from '@/components/seat-selector'
import { Clock, Calendar, ArrowLeft, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { Movie, Showtime } from '@/lib/db'

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [movieRes, showtimesRes] = await Promise.all([
          fetch(`/api/movies/${id}`),
          fetch(`/api/showtimes?movieId=${id}`)
        ])
        
        if (movieRes.ok) {
          const movieData = await movieRes.json()
          setMovie(movieData)
        }
        
        if (showtimesRes.ok) {
          const showtimesData = await showtimesRes.json()
          setShowtimes(showtimesData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Película no encontrada</h1>
          <Link href="/">
            <Button variant="outline">Volver a la cartelera</Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <div className="relative h-[40vh] overflow-hidden md:h-[50vh]">
        <Image
          src={movie.poster_url}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      <main className="container mx-auto px-4">
        {/* Movie Info */}
        <div className="-mt-32 relative mb-12 md:-mt-48">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver a la cartelera
          </Link>

          <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
            {/* Poster */}
            <div className="relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-xl shadow-2xl md:mx-0 md:w-full">
              <Image
                src={movie.poster_url}
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">{movie.rating}</Badge>
                  <Badge variant="secondary">{movie.genre}</Badge>
                </div>
                <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                  {movie.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {movie.duration} minutos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-cinema-gold text-cinema-gold" />
                    {(Math.random() * 2 + 7).toFixed(1)} / 10
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    150 asientos
                  </span>
                </div>
              </div>

              <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                {movie.synopsis}
              </p>

              {/* Functions Selection */}
              <div className="mt-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Selecciona una función
                </h3>
                
                {showtimes.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {showtimes.map((showtime) => (
                      <button
                        key={showtime.id}
                        onClick={() => setSelectedShowtime(showtime)}
                        className={`group flex flex-col items-center gap-1 rounded-lg border p-4 transition-all ${
                          selectedShowtime?.id === showtime.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        }`}
                      >
                        <span className="text-xs text-muted-foreground">{formatDate(showtime.show_date)}</span>
                        <span className="text-sm text-muted-foreground">{showtime.room_name}</span>
                        <span className="text-xl font-bold">{showtime.show_time}</span>
                        <span className="text-sm font-medium text-cinema-gold">
                          {formatPrice(showtime.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay funciones disponibles para esta película.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seat Selector */}
        {selectedShowtime && movie && (
          <SeatSelector 
            showtime={selectedShowtime} 
            movie={movie}
          />
        )}
      </main>
    </div>
  )
}
