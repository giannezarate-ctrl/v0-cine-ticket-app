import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { hashPassword, comparePassword, generateToken, setAuthCookie, getCurrentUser, removeAuthCookie } from '@/lib/auth'

// GET handler para verificar auth
export async function GET(request: Request) {
  try {
    console.log('[Auth API] GET request received')
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    console.log('[Auth API] Action:', action)
    
    if (action === 'me') {
      return await getMe()
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('[Auth API] GET error:', error)
    return NextResponse.json({ error: 'Error en autenticación' }, { status: 500 })
  }
}

// POST handler para login, register, logout
export async function POST(request: Request) {
  try {
    console.log('[Auth API] POST request received')
    
    const body = await request.json()
    const { action } = body
    
    console.log('[Auth API] Action:', action)
    console.log('[Auth API] Body keys:', Object.keys(body))

    if (action === 'register') {
      return await register(body)
    } else if (action === 'login') {
      return await login(body)
    } else if (action === 'logout') {
      return await logout()
    } else if (action === 'me') {
      return await getMe()
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('[Auth API] POST error:', error)
    return NextResponse.json({ error: 'Error en autenticación' }, { status: 500 })
  }
}

async function register(body: {
  name: string
  email: string
  password: string
  phone?: string
}) {
  const { name, email, password, phone } = body

  // Validar campos requeridos
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Nombre, email y contraseña son requeridos' },
      { status: 400 }
    )
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Formato de email inválido' },
      { status: 400 }
    )
  }

  // Validar longitud de contraseña
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'La contraseña debe tener al menos 6 caracteres' },
      { status: 400 }
    )
  }

  // Verificar si el email ya existe
  const existingUsers = await sql`
    SELECT id FROM users WHERE email = ${email.toLowerCase()}
  `

  if (existingUsers.length > 0) {
    return NextResponse.json(
      { error: 'El email ya está registrado' },
      { status: 409 }
    )
  }

  // Hash de la contraseña
  const passwordHash = await hashPassword(password)

  // Crear el usuario
  const newUsers = await sql`
    INSERT INTO users (name, email, password_hash, role, phone)
    VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, 'client', ${phone || null})
    RETURNING id, name, email, role, phone, created_at
  `

  const user = newUsers[0]

  // Generar token y establecer cookie
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  await setAuthCookie(token)

  return NextResponse.json({
    success: true,
    message: 'Usuario registrado exitosamente',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}

async function login(body: { email: string; password: string }) {
  const { email, password } = body

  // Validar campos
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email y contraseña son requeridos' },
      { status: 400 }
    )
  }

  // Buscar usuario
  const users = await sql`
    SELECT id, name, email, password_hash, role, is_active
    FROM users WHERE email = ${email.toLowerCase()}
  `

  if (users.length === 0) {
    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      { status: 401 }
    )
  }

  const user = users[0]

  // Verificar si el usuario está activo
  if (!user.is_active) {
    return NextResponse.json(
      { error: 'Tu cuenta ha sido desactivada' },
      { status: 403 }
    )
  }

  // Verificar contraseña
  const isValidPassword = await comparePassword(password, user.password_hash)

  if (!isValidPassword) {
    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      { status: 401 }
    )
  }

  // Generar token y establecer cookie
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  await setAuthCookie(token)

  return NextResponse.json({
    success: true,
    message: 'Login exitoso',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}

async function logout() {
  const { removeAuthCookie } = await import('@/lib/auth')
  await removeAuthCookie()

  return NextResponse.json({
    success: true,
    message: 'Logout exitoso',
  })
}

async function getMe() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  })
}