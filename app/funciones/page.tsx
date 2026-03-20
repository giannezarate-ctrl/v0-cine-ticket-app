import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { peliculas, funciones, formatearPrecio } from '@/lib/data'
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function FuncionesPage() {
  // Group functions by date
  const functionsByDate = funciones.reduce((acc, funcion) => {
    if (!acc[funcion.fecha]) {
      acc[funcion.fecha] = []
    }
    acc[funcion.fecha].push(funcion)
    return acc
  }, {} as Record<string, typeof funciones>)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">Programación</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Todas las Funciones
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Explora todas las funciones disponibles organizadas por fecha. Selecciona la que más te convenga y reserva tus asientos.
          </p>
        </div>

        {/* Functions by Date */}
        <div className="space-y-12">
          {Object.entries(functionsByDate).map(([date, dateFunctions]) => (
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
                {dateFunctions.map((funcion) => {
                  const movie = peliculas.find(p => p.id === funcion.peliculaId)
                  if (!movie) return null

                  return (
                    <Card key={funcion.id} className="group overflow-hidden border-border bg-card transition-all hover:border-primary/50">
                      <CardContent className="p-0">
                        <div className="flex gap-4 p-4">
                          {/* Movie Poster */}
                          <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={movie.imagenUrl}
                              alt={movie.titulo}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Function Details */}
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <h3 className="mb-1 line-clamp-1 font-semibold text-foreground">
                                {movie.titulo}
                              </h3>
                              <div className="mb-2 flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {movie.clasificacion}
                                </Badge>
                                <Badge variant="outline" className="border-border text-xs">
                                  {movie.genero}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {funcion.hora}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {funcion.sala}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
                          <span className="text-lg font-bold text-cinema-gold">
                            {formatearPrecio(funcion.precio)}
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
        </div>
      </main>
    </div>
  )
}
