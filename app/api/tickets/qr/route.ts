import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  try {
    const buffer = await QRCode.toBuffer(code, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-${code}.png"`,
      },
    })
  } catch (error) {
    console.error('Error generating QR:', error)
    return NextResponse.json({ error: 'Error generando QR' }, { status: 500 })
  }
}