'use client'

import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { SeatSelector } from '@/components/seat-selector'
import { peliculas, funciones, formatearPrecio } from '@/lib/data'
import { Clock, Calendar, ArrowLeft, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const movie = peliculas.find(p => p.id === id)
  const movieFunctions = funciones.filter(f => f.peliculaId === id)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)

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

  const selectedFunctionData = movieFunctions.find(f => f.id === selectedFunction)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <div className="relative h-[40vh] overflow-hidden md:h-[50vh]">
        <Image
          src={movie.imagenUrl}
          alt={movie.titulo}
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
                src={movie.imagenUrl}
                alt={movie.titulo}
                fill
                className="object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">{movie.clasificacion}</Badge>
                  <Badge variant="secondary">{movie.genero}</Badge>
                </div>
                <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                  {movie.titulo}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {movie.duracion} minutos
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
                {movie.descripcion}
              </p>

              {/* Functions Selection */}
              <div className="mt-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Selecciona una función
                </h3>
                
                {movieFunctions.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {movieFunctions.map((funcion) => (
                      <button
                        key={funcion.id}
                        onClick={() => setSelectedFunction(funcion.id)}
                        className={`group flex flex-col items-center gap-1 rounded-lg border p-4 transition-all ${
                          selectedFunction === funcion.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm text-muted-foreground">{funcion.sala}</span>
                        <span className="text-xl font-bold">{funcion.hora}</span>
                        <span className="text-sm font-medium text-cinema-gold">
                          {formatearPrecio(funcion.precio)}
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
        {selectedFunction && selectedFunctionData && (
          <SeatSelector 
            funcion={selectedFunctionData} 
            movie={movie}
          />
        )}
      </main>
    </div>
  )
}
