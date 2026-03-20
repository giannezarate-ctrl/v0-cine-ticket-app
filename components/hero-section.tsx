'use client'

import { Play, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=800&fit=crop')] bg-cover bg-center opacity-10" />
      
      {/* Content */}
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            Nuevos estrenos disponibles
          </div>
          
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Tu experiencia{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              cinematográfica
            </span>{' '}
            comienza aquí
          </h1>
          
          <p className="mb-8 max-w-xl text-pretty text-lg text-muted-foreground md:text-xl">
            Descubre las mejores películas, reserva tus asientos favoritos y vive una experiencia única en nuestras salas premium.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="#cartelera">
              <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                <Ticket className="mr-2 h-5 w-5" />
                Ver Cartelera
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full border-border text-foreground hover:bg-secondary sm:w-auto">
              <Play className="mr-2 h-5 w-5" />
              Próximos Estrenos
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border/50 pt-8">
            <div>
              <div className="text-2xl font-bold text-foreground md:text-3xl">6+</div>
              <div className="text-sm text-muted-foreground">Películas en cartelera</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground md:text-3xl">3</div>
              <div className="text-sm text-muted-foreground">Salas premium</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground md:text-3xl">150</div>
              <div className="text-sm text-muted-foreground">Asientos por sala</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
