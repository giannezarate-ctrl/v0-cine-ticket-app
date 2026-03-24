import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',
  '/login',
  '/registro',
  '/pelicula',
  '/funciones',
  '/validar',
  '/admin/login',
  '/api/auth',
  '/api/movies',
  '/api/funciones',
  '/api/showtimes',
  '/api/rooms',
  '/api/setup',
]

// Rutas que requieren autenticación
const protectedRoutes = [
  '/mis-tickets',
  '/api/tickets',
  '/api/stats',
]

// Rutas que requieren rol de admin
const adminRoutes = [
  '/admin',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('[Middleware] Path:', pathname)
  
  // 1. Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => {
    if (route.startsWith('/api/')) {
      // Para rutas API, verificar si el pathname comienza con esa ruta
      return pathname.startsWith(route)
    }
    // Para rutas de página, verificar coincidencia exacta o prefijo
    return pathname === route || pathname.startsWith(route + '/')
  })
  
  if (isPublicRoute) {
    console.log('[Middleware] Ruta pública permitida:', pathname)
    return NextResponse.next()
  }
  
  // 2. Verificar si es una ruta protegida (que requiere auth)
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // 3. Verificar si es una ruta de admin
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (!isProtectedRoute && !isAdminRoute) {
    // Si no es ruta protegida ni admin, permitir
    return NextResponse.next()
  }
  
  // 4. Verificar token de autenticación
  const token = request.cookies.get('auth-token')?.value
  
  console.log('[Middleware] Token exists:', !!token)
  
  if (!token) {
    console.log('[Middleware] No token, verificando Authorization header')
    // Intentar obtener token del header Authorization
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7)
      console.log('[Middleware] Bearer token found in header')
    }
  }
  
  // Si no hay token y la ruta requiere autenticación, denegar
  if (!token) {
    console.log('[Middleware] Access denied, no token for protected route:', pathname)
    
    // Para rutas API, devolver 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión primero.' },
        { status: 401 }
      )
    }
    
    // Para rutas de página, redirigir a login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 5. Verificar si el token es válido
  try {
    // Decodificar el token JWT manualmente para verificar
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123cineplexapp2024'
    
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('[Middleware] Token válido, user:', decoded.email, 'role:', decoded.role)
    
    // Si es ruta de admin, verificar rol
    if (isAdminRoute && decoded.role !== 'admin') {
      console.log('[Middleware] Access denied, no admin role')
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return NextResponse.next()
  } catch (error: unknown) {
    console.log('[Middleware] Token inválido:', error instanceof Error ? error.message : 'Unknown error')
    
    // Token inválido o expirado, limpiar cookie y redirigir
    const response = NextResponse.next()
    response.cookies.delete('auth-token')
    
    // Para rutas API, devolver 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Sesión expirada. Inicia sesión nuevamente.' },
        { status: 401 }
      )
    }
    
    // Para rutas de página, redirigir a login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}