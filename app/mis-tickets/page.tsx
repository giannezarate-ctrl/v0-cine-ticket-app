'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Calendar, Clock, MapPin, Film, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface TicketData {
  id: number
  codigo: string
  funcion_id: number
  fila: number
  columna: number
  precio: number
  estado: string
  comprador_nombre: string
  comprador_email: string
  validado: boolean
  created_at: string
  movie_title?: string
  show_date?: string
  show_time?: string
  room_name?: string
}

interface UserData {
  id: number
  name: string
  email: string
  role: string
}

export default function MisTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoadTickets()
  }, [])

  async function checkAuthAndLoadTickets() {
    try {
      // Check auth
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'me' }),
      })
      const authData = await authRes.json()

      if (!authData.user) {
        router.push('/login')
        return
      }

      setUser(authData.user)

      // Load user tickets
      const ticketsRes = await fetch('/api/tickets/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json()
        setTickets(ticketsData)
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(estado: string) {
    switch (estado) {
      case 'vendido':
        return <Badge className="bg-green-500">Activo</Badge>
      case 'usado':
        return <Badge className="bg-gray-500">Usado</Badge>
      case 'cancelado':
        return <Badge className="bg-red-500">Cancelado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function formatTime(timeStr: string) {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    return `${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Mis Tickets</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Hola, {user?.name}. Aquí están tus tickets comprados.
          </p>
        </div>
        <Button onClick={() => router.push('/')}>
          <Film className="mr-2 h-4 w-4" />
          Ver Cartelera
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No tienes tickets</h2>
            <p className="text-muted-foreground mb-4">
              Aún no has comprado ningún ticket. ¡Explora nuestras películas!
            </p>
            <Button onClick={() => router.push('/')}>
              Ver Cartelera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Poster placeholder */}
                <div className="md:w-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-4">
                  <Film className="h-12 w-12 text-primary/50" />
                </div>
                
                {/* Ticket info */}
                <div className="flex-1 p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {ticket.movie_title || 'Película'}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {ticket.show_date ? formatDate(ticket.show_date) : '-'}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {ticket.show_time ? formatTime(ticket.show_time) : '-'}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {ticket.room_name || '-'}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Asiento:</span> Fila {ticket.fila}, Columna {ticket.columna}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${ticket.precio.toLocaleString('es-CO')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Código: {ticket.codigo}
                        </div>
                      </div>
                      {getStatusBadge(ticket.estado)}
                      {ticket.validado && (
                        <div className="flex items-center text-green-500 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Validado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}