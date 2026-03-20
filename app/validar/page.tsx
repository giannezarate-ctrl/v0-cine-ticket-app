'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Ticket, CheckCircle2, XCircle, AlertCircle, Search, QrCode } from 'lucide-react'

interface TicketInfo {
  id: number
  ticket_code: string
  customer_name: string
  customer_email: string
  seat_row: string
  seat_number: number
  movie_title: string
  show_date: string
  show_time: string
  room_name: string
  is_validated: boolean
  validated_at: string | null
}

type ValidationStatus = 'idle' | 'valid' | 'used' | 'invalid'

export default function ValidarPage() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<ValidationStatus>('idle')
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const handleValidate = async () => {
    if (!code.trim()) return

    setIsLoading(true)
    setErrorMessage('')
    
    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_code: code })
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('invalid')
        setErrorMessage(data.error || 'Código no encontrado')
        setTicketInfo(null)
        return
      }

      if (data.valid) {
        setStatus('valid')
        setTicketInfo(data.ticket)
      } else {
        setStatus('used')
        setTicketInfo(data.ticket)
      }
    } catch (error) {
      console.error('Error validating ticket:', error)
      setStatus('invalid')
      setErrorMessage('Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusContent = () => {
    switch (status) {
      case 'valid':
        return (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-cinema-green/10 p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cinema-green/20">
              <CheckCircle2 className="h-10 w-10 text-cinema-green" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-cinema-green">Tiquete Válido</h3>
              <p className="mt-2 text-muted-foreground">
                El tiquete ha sido validado correctamente. Puede ingresar a la sala.
              </p>
            </div>
            <Badge className="bg-cinema-green/20 text-cinema-green">
              Acceso Permitido
            </Badge>
            
            {ticketInfo && (
              <div className="mt-4 w-full rounded-lg border border-border bg-card p-4 text-left">
                <p className="font-semibold text-foreground">{ticketInfo.movie_title}</p>
                <p className="text-sm text-muted-foreground">{formatDate(ticketInfo.show_date)} - {ticketInfo.show_time}</p>
                <p className="text-sm text-muted-foreground">{ticketInfo.room_name}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cliente: <span className="text-foreground">{ticketInfo.customer_name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Asiento: <span className="font-mono text-primary">{ticketInfo.seat_row}{ticketInfo.seat_number}</span>
                </p>
              </div>
            )}
          </div>
        )
      case 'used':
        return (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-accent/10 p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
              <AlertCircle className="h-10 w-10 text-accent" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-accent">Tiquete Ya Usado</h3>
              <p className="mt-2 text-muted-foreground">
                Este tiquete ya fue utilizado anteriormente y no puede volver a usarse.
              </p>
            </div>
            <Badge className="bg-accent/20 text-accent">
              Acceso Denegado
            </Badge>
            
            {ticketInfo && (
              <div className="mt-4 w-full rounded-lg border border-border bg-card p-4 text-left">
                <p className="font-semibold text-foreground">{ticketInfo.movie_title}</p>
                <p className="text-sm text-muted-foreground">{formatDate(ticketInfo.show_date)} - {ticketInfo.show_time}</p>
                <p className="text-sm text-muted-foreground">{ticketInfo.room_name}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cliente: <span className="text-foreground">{ticketInfo.customer_name}</span>
                </p>
                {ticketInfo.validated_at && (
                  <p className="text-sm text-destructive">
                    Validado: {new Date(ticketInfo.validated_at).toLocaleString('es-CO')}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      case 'invalid':
        return (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-destructive/10 p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-destructive">Tiquete Inválido</h3>
              <p className="mt-2 text-muted-foreground">
                {errorMessage || 'El código ingresado no corresponde a ningún tiquete válido en el sistema.'}
              </p>
            </div>
            <Badge className="bg-destructive/20 text-destructive">
              Código No Encontrado
            </Badge>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
              <Ticket className="h-5 w-5" />
              <span className="text-sm font-medium">Validación de Tiquetes</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Validar Entrada
            </h1>
            <p className="text-muted-foreground">
              Ingresa el código del tiquete para verificar su validez y registrar el acceso.
            </p>
          </div>

          {/* Validation Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <QrCode className="h-5 w-5 text-primary" />
                Código del Tiquete
              </CardTitle>
              <CardDescription>
                Ingresa o escanea el código único del tiquete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Ej: A1B2C3D4"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setStatus('idle')
                  }}
                  className="flex-1 border-border bg-input font-mono text-foreground uppercase placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                />
                <Button 
                  onClick={handleValidate}
                  disabled={!code.trim() || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Validando
                    </span>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Validar
                    </>
                  )}
                </Button>
              </div>

              {/* Status Result */}
              {status !== 'idle' && getStatusContent()}

              {/* Quick Tips */}
              {status === 'idle' && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="mb-2 font-medium text-foreground">Formato del código</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>El código tiene 8 caracteres alfanuméricos.</li>
                    <li>Ejemplo: A1B2C3D4</li>
                    <li>El código es único para cada asiento comprado.</li>
                  </ul>
                </div>
              )}

              {/* Reset Button */}
              {status !== 'idle' && (
                <Button
                  variant="outline"
                  className="w-full border-border"
                  onClick={() => {
                    setCode('')
                    setStatus('idle')
                    setTicketInfo(null)
                  }}
                >
                  Validar otro tiquete
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
