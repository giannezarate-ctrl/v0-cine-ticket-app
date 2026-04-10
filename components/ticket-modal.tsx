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
import type { Movie, Showtime } from '@/lib/db'
import { CheckCircle2, Download, Copy, Film, Printer } from 'lucide-react'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface TicketModalProps {
  open: boolean
  onClose: () => void
  ticketCodes: string[]
  movie: Movie
  showtime: Showtime
  seats: string[]
  total: number
  customerName: string
}

export function TicketModal({
  open,
  onClose,
  ticketCodes,
  movie,
  showtime,
  seats,
  total,
  customerName,
}: TicketModalProps) {
  const [copied, setCopied] = useState(false)
  const [qrCodes, setQrCodes] = useState<string[]>([])

  useEffect(() => {
    async function generateQR() {
      if (!ticketCodes.length) return
      console.log('[QR] Generating for codes:', ticketCodes)
      try {
        const codes = await Promise.all(
          ticketCodes.map(async (code) => {
            const qrDataUrl = await QRCode.toDataURL(code, {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff'
              }
            })
            return qrDataUrl
          })
        )
        setQrCodes(codes)
        console.log('[QR] Generated', codes.length, 'QR codes')
      } catch (err) {
        console.error('[QR] Error generating:', err)
      }
    }
    generateQR()
  }, [ticketCodes])

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ticketCodes.join(', '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const invoiceContent = `
========================================
         CINEPLEX - FACTURA
========================================

Fecha: ${new Date().toLocaleDateString('es-CO')}
Hora: ${new Date().toLocaleTimeString('es-CO')}

----------------------------------------
DATOS DEL CLIENTE
----------------------------------------
Cliente: ${customerName}

----------------------------------------
DETALLE DE LA COMPRA
----------------------------------------
Pelicula: ${movie.title}
Funcion: ${formatDate(showtime.show_date)}
Hora: ${showtime.show_time}
Sala: ${showtime.room_name}

Asientos: ${seats.join(', ')}

----------------------------------------
CODIGOS DE TICKET
----------------------------------------
${ticketCodes.join('\n')}

========================================
TOTAL PAGADO: ${formatPrice(total)}
========================================

Gracias por su compra!
Presente este ticket en la entrada.

========================================
    CINEPLEX - Donde la magia cobra vida
========================================
    `
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CinePlex_Factura_${ticketCodes[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>CinePlex - Ticket</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .title { font-size: 24px; font-weight: bold; }
    .info { margin: 10px 0; }
    .label { font-weight: bold; }
    .codes { background: #f0f0f0; padding: 10px; text-align: center; font-family: monospace; font-size: 16px; }
    .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">CINEPLEX</div>
    <div>FACTURA DE COMPRA</div>
  </div>
  <div class="info"><span class="label">Fecha:</span> ${new Date().toLocaleDateString('es-CO')}</div>
  <div class="info"><span class="label">Cliente:</span> ${customerName}</div>
  <div class="info"><span class="label">Pelicula:</span> ${movie.title}</div>
  <div class="info"><span class="label">Funcion:</span> ${formatDate(showtime.show_date)}</div>
  <div class="info"><span class="label">Hora:</span> ${showtime.show_time}</div>
  <div class="info"><span class="label">Sala:</span> ${showtime.room_name}</div>
  <div class="info"><span class="label">Asientos:</span> ${seats.join(', ')}</div>
  <div class="codes">
    <div>CODIGO(S):</div>
    ${ticketCodes.map(c => `<div>${c}</div>`).join('')}
  </div>
  <div class="total">TOTAL: ${formatPrice(total)}</div>
  <div class="footer">
    Gracias por su compra!<br>
    Presente este ticket en la entrada<br>
    CINEPLEX - Donde la magia cobra vida
  </div>
</body>
</html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] sm:max-w-md border-border bg-card max-h-[90vh] overflow-y-auto">
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

            <div className="mb-2 text-center">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-semibold text-foreground">{customerName}</p>
            </div>

            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold text-foreground">{movie.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(showtime.show_date)} - {showtime.show_time}
              </p>
              <p className="text-sm text-muted-foreground">{showtime.room_name}</p>
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

            {/* QR Codes */}
            {qrCodes.length > 0 && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Escanea para entrar
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {qrCodes.map((qr, index) => (
                    <div key={index} className=" rounded-lg bg-white p-2">
                      <img src={qr} alt="QR Code" className="h-32 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-4 border-dashed" />

            {/* Ticket Codes */}
            <div className="text-center">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                {ticketCodes.length > 1 ? 'Códigos de los tiquetes' : 'Código del tiquete'}
              </p>
              <div className="flex flex-col items-center gap-2">
                {ticketCodes.map((code, index) => (
                  <code key={index} className="rounded-lg bg-background px-4 py-2 font-mono text-lg font-bold tracking-wider text-primary">
                    {code}
                  </code>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="mt-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-cinema-green" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar códigos
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <span className="font-medium text-foreground">Total pagado</span>
            <span className="text-xl font-bold text-cinema-gold">{formatPrice(total)}</span>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 border-border order-2 sm:order-1" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 order-1 sm:order-2" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Button variant="secondary" className="flex-1 order-3" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
