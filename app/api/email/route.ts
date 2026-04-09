import { NextResponse } from 'next/server'
import { sendEmail, sendTicketEmail, sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/email'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'send-ticket': {
        const { email, name, movieTitle, showDate, showTime, seats, totalAmount } = data
        const result = await sendTicketEmail(email, name, movieTitle, showDate, showTime, seats, totalAmount)
        return NextResponse.json(result)
      }

      case 'send-welcome': {
        const { email, name } = data
        const result = await sendWelcomeEmail(email, name)
        return NextResponse.json(result)
      }

      case 'send-reset': {
        const { email, name, resetToken } = data
        const result = await sendPasswordResetEmail(email, name, resetToken)
        return NextResponse.json(result)
      }

      case 'custom': {
        const { to, subject, htmlContent, textContent } = data
        const result = await sendEmail({
          to: Array.isArray(to) ? to : [{ email: to }],
          subject,
          htmlContent,
          textContent,
        })
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Accion no valida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
  }
}
