'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ShoppingCart, Ticket, Check, Monitor, Loader2 } from 'lucide-react'
import { TicketModal } from './ticket-modal'
import type { Movie, Showtime } from '@/lib/db'

interface SeatSelectorProps {
  showtime: Showtime
  movie: Movie
}

interface OccupiedSeat {
  seat_row: string
  seat_number: number
}

export function SeatSelector({ showtime, movie }: SeatSelectorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [occupiedSeats, setOccupiedSeats] = useState<OccupiedSeat[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [showTicket, setShowTicket] = useState(false)
  const [ticketCodes, setTicketCodes] = useState<string[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null)

  const rowsCount = showtime.rows_count || 10
  const seatsPerRow = showtime.seats_per_row || 6
  const filas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, rowsCount).split('')
  const columnas = Array.from({ length: seatsPerRow }, (_, i) => i + 1)

  async function fetchOccupiedSeats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/showtimes/${showtime.id}/seats`)
      if (res.ok) {
        const data = await res.json()
        const seatsArray = Array.isArray(data.seats) ? data.seats : []
        const occupied = seatsArray
          .filter((s: any) => s.status === 'occupied')
          .map((s: any) => ({ seat_row: s.row, seat_number: s.number }))
        setOccupiedSeats(occupied)
      }
    } catch (error) {
      console.error('Error fetching seats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'me' })
        })
        const data = await res.json()
        if (data.user) {
          setCurrentUser(data.user)
          setCustomerName(data.user.name)
          setCustomerEmail(data.user.email)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    fetchOccupiedSeats()
    setSelectedSeats([])
  }, [showtime.id])

  const isSeatOccupied = (row: string, col: number) => {
    if (!Array.isArray(occupiedSeats)) return false
    return occupiedSeats.some(s => s && s.seat_row === row && s.seat_number === col)
  }

  const toggleSeat = (row: string, col: number) => {
    if (isSeatOccupied(row, col)) return

    const seatId = `${row}${col}`
    setSelectedSeats(prev => 
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    )
  }

  const total = selectedSeats.length * showtime.price

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const handlePurchase = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (selectedSeats.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sin asientos',
        description: 'Por favor selecciona al menos un asiento',
      })
      return
    }

    setPurchasing(true)
    try {
      const seats = selectedSeats.map(seat => ({
        row: seat.charAt(0),
        number: parseInt(seat.slice(1))
      }))

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtime_id: showtime.id,
          seats,
          user_id: currentUser.id,
          customer_name: currentUser.name,
          customer_email: currentUser.email
        })

      })

      if (res.ok) {
        const ticket = await res.json()
        setTicketCodes([ticket.code])
        setShowTicket(true)
        toast({
          title: '¡Compra exitosa!',
          description: 'Tu entrada ha sido generada. Revisa tu correo.',
        })
      } else {
        const error = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error en la compra',
          description: error.error || 'No se pudo procesar la compra',
        })
      }
    } catch (error) {
      console.error('Error purchasing tickets:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al procesar la compra',
      })
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <section className="mb-16 rounded-2xl border border-border bg-card/50 p-3 sm:p-6 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            Selecciona tus asientos
          </h2>
          <p className="text-sm text-muted-foreground">
            {showtime.room_name} - {formatDate(showtime.show_date)} - {showtime.show_time}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Seat Map */}
        <div className="overflow-x-auto pb-4">
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Seats Grid */}
              <div className="flex flex-col items-center gap-2">
                {filas.map(fila => (
                  <div key={fila} className="flex items-center gap-1 sm:gap-2">
                    <span className="w-4 sm:w-6 text-center text-[10px] sm:text-sm font-medium text-muted-foreground">
                      {fila}
                    </span>
                    <div className="flex gap-0.5 sm:gap-1">
                      {columnas.map(col => {
                        const seatId = `${fila}${col}`
                        const isSelected = selectedSeats.includes(seatId)
                        const isOccupied = isSeatOccupied(fila, col)
                        
                        return (
                          <button
                            key={seatId}
                            onClick={() => toggleSeat(fila, col)}
                            disabled={isOccupied}
                            className={`
                              flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-t-lg text-[10px] sm:text-xs font-medium transition-all
                              ${isOccupied 
                                ? 'cursor-not-allowed bg-destructive/20 text-destructive/40' 
                                : isSelected 
                                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                                  : 'bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary'
                              }
                            `}
                            title={seatId}
                          >
                            {col}
                          </button>
                        )
                      })}
                    </div>
                    <span className="w-4 sm:w-6 text-center text-[10px] sm:text-sm font-medium text-muted-foreground">
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
            </>
          )}
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
              <p className="font-semibold text-foreground">{movie.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(showtime.show_date)} - {showtime.show_time}
              </p>
              <p className="text-sm text-muted-foreground">{showtime.room_name}</p>
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

            {/* Customer Info */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-foreground">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Tu nombre completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Precio por tiquete</span>
                <span>{formatPrice(showtime.price)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Cantidad</span>
                <span>{selectedSeats.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-cinema-gold">{formatPrice(total)}</span>
              </div>
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              disabled={selectedSeats.length === 0 || purchasing}
              onClick={handlePurchase}
            >
              {purchasing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Check className="mr-2 h-5 w-5" />
              )}
              {purchasing ? 'Procesando...' : 'Confirmar Compra'}
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
          setCustomerName('')
          setCustomerEmail('')
          fetchOccupiedSeats()
        }}
        ticketCodes={ticketCodes}
        movie={movie}
        showtime={showtime}
        seats={selectedSeats}
        total={total}
        customerName={customerName}
      />
    </section>
  )
}
