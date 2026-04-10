import QRCode from 'qrcode'
import { v2 as cloudinary } from 'cloudinary'

const BREVO_API_URL = 'https://api.brevo.com/v3'
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.BREVO_APIKEY
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SENDER_NAME || 'noreply@tucinema.com'
const BREVO_SENDER_NAME = process.env.BREVO_NAME || process.env.BREVO_SENDER_NAME || 'Tu Cine'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function generateQRCodeImage(ticketCode: string): Promise<string | null> {
  try {
    const qrBuffer = await QRCode.toBuffer(ticketCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'cine-qr',
          public_id: `ticket-${ticketCode}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            resolve(null)
          } else {
            resolve(result?.secure_url || null)
          }
        }
      )
      uploadStream.end(qrBuffer)
    })
  } catch (err) {
    console.error('Error generating QR code:', err)
    return null
  }
}

async function generateQRBase64(ticketCode: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(ticketCode, {
      width: 250,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
    return dataUrl
  } catch (err) {
    console.error('Error generating QR base64:', err)
    return ''
  }
}

function getGoogleChartsQRUrl(ticketCode: string): string {
  return `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chco=000000&chl=${encodeURIComponent(ticketCode)}&chf=bg,FFFFFF`
}

interface SendEmailParams {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
  textContent?: string
}

export async function sendEmail({ to, subject, htmlContent, textContent }: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_APIKEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SENDER_NAME || 'correosbrevoyess@gmail.com'
  const senderName = process.env.BREVO_NAME || 'GYBIM'

  console.log('[EMAIL] sendEmail called - apiKey exists:', !!apiKey, 'senderEmail:', senderEmail, 'senderName:', senderName)
  
  if (!apiKey) {
    console.error('BREVO_API_KEY no configurado')
    return { success: false, error: 'API key no configurada' }
  }

  try {
    console.log('[EMAIL] Sending to:', to.map(t => t.email).join(', '))
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: to.map(t => ({
          email: t.email,
          name: t.name || '',
        })),
        subject,
        htmlContent,
        textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      }),
    })

    const data = await response.json()

    console.log('[EMAIL] Brevo response status:', response.status, 'response:', JSON.stringify(data))

    if (!response.ok) {
      console.error('Error Brevo:', data)
      return { success: false, error: data.message || 'Error enviando email' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error enviando email:', error)
    return { success: false, error: 'Error de conexion' }
  }
}

export async function sendTicketEmail(
  customerEmail: string,
  customerName: string,
  movieTitle: string,
  showDate: string,
  showTime: string,
  seats: string[],
  totalAmount: number,
  ticketCode?: string,
  roomName?: string
) {
  const formattedDate = new Date(showDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const qrCodeUrl = ticketCode ? getGoogleChartsQRUrl(ticketCode) : ''
  console.log('[EMAIL] QR Code URL:', qrCodeUrl)

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #e50914; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="color: #e50914; margin: 0;">🎬 Tu Cine</h1>
        <p style="color: #666; margin: 5px 0;">Comprobante de compra</p>
      </div>
      
      ${ticketCode ? `
      <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 12px; color: #888;">CODIGO DE ENTRADA</p>
        <p style="margin: 10px 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #e50914;">${ticketCode}</p>
      </div>
      ` : ''}
      
      <p>Hola <strong>${customerName}</strong>,</p>
      <p>Gracias por tu compra! Aqui tienes tu comprobante:</p>
      
      <div style="background: #f8f8f8; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #e50914;">
        <h2 style="color: #333; margin-top: 0; font-size: 22px;">${movieTitle}</h2>
        
        <table style="width: 100%; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #666;">📅 Fecha:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">🕐 Hora:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${showTime}</td>
          </tr>
          ${roomName ? `
          <tr>
            <td style="padding: 8px 0; color: #666;">🏠 Sala:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${roomName}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #666;">🎫 Butacas:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${seats.join(', ')}</td>
          </tr>
        </table>
        
        <div style="border-top: 1px solid #ddd; margin-top: 15px; padding-top: 15px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px 0;">Cantidad:</td>
              <td style="text-align: right;">${seats.length} entrada${seats.length > 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 18px; font-weight: bold;">TOTAL PAGADO:</td>
              <td style="text-align: right; font-size: 22px; font-weight: bold; color: #e50914;">$${totalAmount.toLocaleString('es-CO')}</td>
            </tr>
          </table>
        </div>
      </div>
      
      ${qrCodeUrl ? `
      <div style="text-align: center; margin: 25px 0; padding: 20px; background: white; border-radius: 10px; border: 2px solid #e50914;">
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;"><strong>Escanea este codigo QR en la entrada</strong></p>
        <img src="${qrCodeUrl}" alt="Codigo QR" style="width: 180px; height: 180px;" />
      </div>
      ` : ''}
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>⚠️ Importante:</strong></p>
        <ul style="margin: 10px 0 0 20px; padding: 0; font-size: 14px;">
          <li>Presenta este correo o el codigo QR en la entrada del cine</li>
          <li>Llega 15 minutos antes de la funcion</li>
          <li>No se permiten entradas tarde</li>
        </ul>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        Tu Cine - La mejor experiencia cinematografica<br>
        Este comprobante es tu prueba de compra
      </p>
    </div>
  `

  return sendEmail({
    to: [{ email: customerEmail, name: customerName }],
    subject: `🎬 Entrada: ${movieTitle} - ${formattedDate}`,
    htmlContent,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e50914;">Bienvenido a Tu Cine! 🎬</h1>
      <p>Hola <strong>${name}</strong>, bienvenido!</p>
      <p>Tu cuenta ha sido creada exitosamente. Ya puedes:</p>
      <ul>
        <li>Comprar entradas online</li>
        <li>Reservar asientos</li>
        <li>Ver el menu de dulces y snacks</li>
      </ul>
      <p>Disfruta de la mejor experiencia cinematografica!</p>
    </div>
  `

  return sendEmail({
    to: [{ email, name }],
    subject: 'Bienvenido a Tu Cine!',
    htmlContent,
  })
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e50914;">Restablecer contraseña</h1>
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <p style="margin: 30px 0;">
        <a href="${resetUrl}" style="background: #e50914; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
          Restablecer contraseña
        </a>
      </p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
      <p style="color: #666; font-size: 12px;">El enlace expira en 1 hora.</p>
    </div>
  `

  return sendEmail({
    to: [{ email, name }],
    subject: 'Restablecer contraseña - Tu Cine',
    htmlContent,
  })
}
