'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Star, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Movie } from '@/lib/data'

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:ring-2 hover:ring-primary/50">
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={movie.imagenUrl}
          alt={movie.titulo}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Classification Badge */}
        <Badge 
          className="absolute right-3 top-3 bg-background/90 text-foreground backdrop-blur-sm"
        >
          {movie.clasificacion}
        </Badge>

        {/* Quick Actions - Appear on hover */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <Link href={`/pelicula/${movie.id}`} className="w-full">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Funciones
            </Button>
          </Link>
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground">
          {movie.titulo}
        </h3>
        
        <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {movie.duracion} min
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
            {(Math.random() * 2 + 7).toFixed(1)}
          </span>
        </div>

        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
          {movie.genero}
        </Badge>
      </div>
    </div>
  )
}
