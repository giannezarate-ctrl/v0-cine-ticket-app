'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatearPrecio, type Funcion, type Movie } from '@/lib/data'
import { CheckCircle2, Download, Copy, Film } from 'lucide-react'
import { useState } from 'react'

interface TicketModalProps {
  open: boolean
  onClose: () => void
  ticketCode: string
  movie: Movie
  funcion: Funcion
  seats: string[]
  total: number
}

export function TicketModal({
  open,
  onClose,
  ticketCode,
  movie,
  funcion,
  seats,
  total,
}: TicketModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ticketCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center">
            <CheckCircle2 className="h-6 w-6 text-cinema-green" />
            <span className="text-foreground">Compra Exitosa</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ticket Visual */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-card to-accent/10 p-6">
            {/* Decorative elements */}
            <div className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background" />
            <div className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background" />
            
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Film className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">CinePlex</span>
            </div>

            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold text-foreground">{movie.titulo}</h3>
              <p className="text-sm text-muted-foreground">
                {funcion.fecha} - {funcion.hora}
              </p>
              <p className="text-sm text-muted-foreground">{funcion.sala}</p>
            </div>

            <div className="mb-4 flex justify-center">
              <div className="flex flex-wrap justify-center gap-1">
                {seats.map(seat => (
                  <Badge key={seat} className="bg-primary/20 text-primary">
                    {seat}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="my-4 border-dashed" />

            {/* Ticket Code */}
            <div className="text-center">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                Código del tiquete
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="rounded-lg bg-background px-4 py-2 font-mono text-lg font-bold tracking-wider text-primary">
                  {ticketCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-cinema-green" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <span className="font-medium text-foreground">Total pagado</span>
            <span className="text-xl font-bold text-cinema-gold">{formatearPrecio(total)}</span>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-2 font-medium text-foreground">Instrucciones</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Presenta este código en la entrada del cine.</li>
              <li>Llega 15 minutos antes de la función.</li>
              <li>El código es válido solo para la función seleccionada.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-border" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
