import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = [
  '/mis-tickets',
  '/admin',
  '/validar',
]

const adminPaths = [
  '/admin',
  '/validar',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('[Proxy] Processing:', pathname)
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  if (pathname === '/setup') {
    return NextResponse.next()
  }
  
  const needsAuth = protectedPaths.some(p => 
    pathname === p || pathname.startsWith(p + '/')
  )
  
  if (!needsAuth) {
    console.log('[Proxy] Not protected, allowing')
    return NextResponse.next()
  }
  
  console.log('[Proxy] Protected route, checking auth')
  
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    console.log('[Proxy] No token found')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    console.log('[Proxy] Token valid for:', payload.email, 'role:', payload.role)
    
    const isAdminRoute = adminPaths.some(p => pathname.startsWith(p))
    if (isAdminRoute && payload.role !== 'admin') {
      console.log('[Proxy] Not admin, redirecting')
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    console.log('[Proxy] Token validation failed:', error)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/mis-tickets/:path*',
    '/admin/:path*',
    '/validar/:path*',
  ],
}
