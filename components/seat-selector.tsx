'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  generarAsientos, 
  formatearPrecio, 
  generarCodigoTiquete,
  type Funcion,
  type Movie,
  type Asiento 
} from '@/lib/data'
import { ShoppingCart, Ticket, Check, Monitor } from 'lucide-react'
import { TicketModal } from './ticket-modal'

interface SeatSelectorProps {
  funcion: Funcion
  movie: Movie
}

export function SeatSelector({ funcion, movie }: SeatSelectorProps) {
  const asientos = useMemo(() => generarAsientos(), [])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [showTicket, setShowTicket] = useState(false)
  const [ticketCode, setTicketCode] = useState('')

  const toggleSeat = (asiento: Asiento) => {
    if (asiento.estado === 'ocupado') return

    setSelectedSeats(prev => 
      prev.includes(asiento.id)
        ? prev.filter(id => id !== asiento.id)
        : [...prev, asiento.id]
    )
  }

  const total = selectedSeats.length * funcion.precio

  const handlePurchase = () => {
    const code = generarCodigoTiquete()
    setTicketCode(code)
    setShowTicket(true)
  }

  const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

  return (
    <section className="mb-16 rounded-2xl border border-border bg-card/50 p-6 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            Selecciona tus asientos
          </h2>
          <p className="text-sm text-muted-foreground">
            {funcion.sala} - {funcion.hora}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Seat Map */}
        <div className="overflow-x-auto">
          {/* Screen */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Monitor className="h-4 w-4" />
              PANTALLA
            </div>
          </div>

          {/* Seats Grid */}
          <div className="flex flex-col items-center gap-2">
            {filas.map(fila => (
              <div key={fila} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {fila}
                </span>
                <div className="flex gap-1">
                  {asientos
                    .filter(a => a.fila === fila)
                    .map(asiento => {
                      const isSelected = selectedSeats.includes(asiento.id)
                      const isOccupied = asiento.estado === 'ocupado'
                      
                      return (
                        <button
                          key={asiento.id}
                          onClick={() => toggleSeat(asiento)}
                          disabled={isOccupied}
                          className={`
                            flex h-7 w-7 items-center justify-center rounded-t-lg text-xs font-medium transition-all
                            md:h-8 md:w-8
                            ${isOccupied 
                              ? 'cursor-not-allowed bg-destructive/20 text-destructive/40' 
                              : isSelected 
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                                : 'bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary'
                            }
                          `}
                          title={`${asiento.fila}${asiento.columna}`}
                        >
                          {asiento.columna}
                        </button>
                      )
                    })}
                </div>
                <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {fila}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-t-lg bg-secondary" />
              <span className="text-sm text-muted-foreground">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-t-lg bg-primary shadow-lg shadow-primary/30" />
              <span className="text-sm text-muted-foreground">Seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-t-lg bg-destructive/20" />
              <span className="text-sm text-muted-foreground">Ocupado</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="h-fit border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="h-5 w-5" />
              Resumen de compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-foreground">{movie.titulo}</p>
              <p className="text-sm text-muted-foreground">
                {funcion.fecha} - {funcion.hora}
              </p>
              <p className="text-sm text-muted-foreground">{funcion.sala}</p>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Asientos seleccionados ({selectedSeats.length})
              </p>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedSeats.map(seat => (
                    <Badge key={seat} variant="secondary" className="bg-primary/10 text-primary">
                      {seat}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ningún asiento seleccionado
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Precio por tiquete</span>
                <span>{formatearPrecio(funcion.precio)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Cantidad</span>
                <span>{selectedSeats.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-cinema-gold">{formatearPrecio(total)}</span>
              </div>
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              disabled={selectedSeats.length === 0}
              onClick={handlePurchase}
            >
              <Check className="mr-2 h-5 w-5" />
              Confirmar Compra
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        open={showTicket}
        onClose={() => {
          setShowTicket(false)
          setSelectedSeats([])
        }}
        ticketCode={ticketCode}
        movie={movie}
        funcion={funcion}
        seats={selectedSeats}
        total={total}
      />
    </section>
  )
}
