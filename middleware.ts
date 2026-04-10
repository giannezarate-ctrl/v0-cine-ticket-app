import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedPaths = [
  '/mis-tickets',
  '/admin',
  '/validar',
]

// Rutas de admin que requieren rol específico
const adminPaths = [
  '/admin',
  '/validar',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('[Middleware] Processing:', pathname)
  
  // 1. Siempre permitir rutas estáticas y Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // 2. Siempre permitir rutas de setup
  if (pathname === '/setup') {
    return NextResponse.next()
  }
  
  // 3. Verificar si es una ruta que necesita protección
  const needsAuth = protectedPaths.some(p => 
    pathname === p || pathname.startsWith(p + '/')
  )
  
  if (!needsAuth) {
    console.log('[Middleware] Not protected, allowing')
    return NextResponse.next()
  }
  
  // 4. Ruta protegida - verificar token
  console.log('[Middleware] Protected route, checking auth')
  
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    console.log('[Middleware] No token found')
    
    // Redirigir a login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 5. Token encontrado - verificar validez
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    
    console.log('[Middleware] Token valid for:', payload.email, 'role:', payload.role)
    
    // Verificar si es admin cuando accede a rutas de admin
    const isAdminRoute = adminPaths.some(p => pathname.startsWith(p))
    if (isAdminRoute && payload.role !== 'admin') {
      console.log('[Middleware] Not admin, redirecting')
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    console.log('[Middleware] Token validation failed:', error)
    
    // Redirigir a login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  /*
   * Aplicar middleware solo a rutas específicas que lo necesitan:
   * - /mis-tickets (页 protegida)
   * - /admin (panel de admin)
   * - /validar (validación de tickets - solo admin)
   * 
   * NO aplicar a rutas API ya que cada ruta maneja su propia autenticación
   */
  matcher: [
    '/mis-tickets/:path*',
    '/admin/:path*',
    '/validar/:path*',
  ],
}