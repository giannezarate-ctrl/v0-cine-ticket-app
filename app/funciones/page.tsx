"use client"

import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { useMemo } from 'react'

interface Funcion {
  id: number
  movie_id: number
  room_id: number
  date: string
  time: string
  price: number
  is_active: boolean
  room_name: string
  m_id: number
  m_title: string
  m_genre: string
  m_duration: number
  m_rating: string
  m_synopsis: string
  m_poster_url: string
  m_trailer_url: string | null
  m_release_date: string
  m_is_active: boolean
}

const fetcher = (url: string) => fetch(url, { 
  cache: 'force-cache',
  next: { revalidate: 60 }
}).then(res => res.json())

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(price)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2, 3].map((day) => (
        <section key={day}>
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((card) => (
              <Card key={card} className="border-border bg-card">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <Skeleton className="h-28 w-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function FuncionesPage() {
  const { data: funciones, isLoading } = useSWR<Funcion[]>('/api/funciones', fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false
  })

  const showtimesByDate = useMemo(() => {
    if (!funciones) return {}
    
    return funciones.reduce((acc, showtime) => {
      const dateKey = showtime.date?.split('T')[0]
      if (!dateKey) return acc
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(showtime)
      return acc
    }, {} as Record<string, Funcion[]>)
  }, [funciones])

  const sortedDates = useMemo(() => {
    return Object.keys(showtimesByDate).sort((a, b) => a.localeCompare(b))
  }, [showtimesByDate])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">Programacion</span>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
            Todas las Funciones
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Explora todas las funciones disponibles organizadas por fecha. Selecciona la que mas te convenga y reserva tus asientos.
          </p>
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && sortedDates.length > 0 && (
          <div className="space-y-8 md:space-y-12">
            {sortedDates.map((date) => (
              <section key={date}>
                <div className="mb-4 md:mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-secondary">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold capitalize text-foreground">
                    {formatDate(date)}
                  </h2>
                </div>

                <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {showtimesByDate[date].map((showtime) => (
                    <Card key={showtime.id} className="group overflow-hidden border-border bg-card transition-all hover:border-primary/50">
                      <CardContent className="p-0">
                        <div className="flex gap-3 p-3 md:p-4">
                          <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg md:h-28 md:w-20">
                            <Image
                              src={showtime.m_poster_url}
                              alt={showtime.m_title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>

                          <div className="flex flex-1 flex-col justify-between min-w-0">
                            <div>
                              <h3 className="mb-1 line-clamp-1 font-semibold text-foreground text-sm md:text-base">
                                {showtime.m_title}
                              </h3>
                              <div className="mb-1 md:mb-2 flex flex-wrap gap-1 md:gap-2">
                                <Badge variant="secondary" className="text-[10px] md:text-xs px-1 py-0">
                                  {showtime.m_rating}
                                </Badge>
                                <Badge variant="outline" className="border-border text-[10px] md:text-xs px-1 py-0">
                                  {showtime.m_genre}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {showtime.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {showtime.room_name}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 md:px-4 md:py-3">
                          <span className="text-base md:text-lg font-bold text-cinema-gold">
                            {formatPrice(showtime.price)}
                          </span>
                          <Link href={`/pelicula/${showtime.m_id}`} prefetch={true}>
                            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs md:text-sm">
                              <Ticket className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                              Comprar
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!isLoading && sortedDates.length === 0 && (
          <div className="py-12 md:py-20 text-center">
            <Calendar className="mx-auto mb-4 h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
            <p className="text-base md:text-lg text-muted-foreground">No hay funciones programadas</p>
          </div>
        )}
      </main>
    </div>
  )
}
