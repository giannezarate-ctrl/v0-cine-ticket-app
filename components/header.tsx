'use client'

import Link from 'next/link'
import { Film, Ticket, LayoutDashboard, Menu, X, User, LogOut, UserPlus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'

interface UserData {
  id: number
  name: string
  email: string
  role: string
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'me' }),
        credentials: 'include', // Incluir cookies
      })
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
      setUser(null)
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  interface NavLink {
    href: string
    label: string
    icon?: React.ElementType
  }

  const navLinks: NavLink[] = [
    { href: '/', label: 'Cartelera' },
    { href: '/funciones', label: 'Funciones' },
  ]

  const adminLinks: NavLink[] = [
    { href: '/validar', label: 'Validar Tiquete', icon: Ticket },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
        <Link href="/" className="flex items-center gap-2" prefetch={true}>
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-primary">
            <Film className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">
            CinePlex
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href} prefetch={true}>
                <Button 
                  variant="ghost" 
                  className={`${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'} hover:text-foreground`}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {link.label}
                </Button>
              </Link>
            )
          })}
          {user?.role === 'admin' && adminLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href} prefetch={true}>
                <Button 
                  variant="ghost" 
                  className={`${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'} hover:text-foreground`}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {link.label}
                </Button>
              </Link>
            )
          })}
          
          {loading ? (
            <Button variant="ghost" className="ml-2" disabled>
              <User className="h-4 w-4 animate-pulse" />
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Panel Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/mis-tickets">
                    <Ticket className="mr-2 h-4 w-4" />
                    Mis Tickets
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" prefetch={true}>
              <Button variant="outline" className="ml-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
                <User className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                Cartelera
              </Button>
            </Link>
            <Link href="/funciones" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                Funciones
              </Button>
            </Link>
            
            {loading ? (
              <Button variant="ghost" className="w-full" disabled>
                <User className="mr-2 h-4 w-4 animate-pulse" />
                Cargando...
              </Button>
            ) : user ? (
              <>
                <div className="flex items-center gap-2 px-2 py-2 border-y border-border/40">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {user.role === 'admin' && (
                  <>
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Button>
                    </Link>
                    <Link href="/validar" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Ticket className="mr-2 h-4 w-4" />
                        Validar Tiquete
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/mis-tickets" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Ticket className="mr-2 h-4 w-4" />
                    Mis Tickets
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-red-500" onClick={() => { handleLogout(); setIsMenuOpen(false) }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start border-primary/50 text-primary">
                  <User className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
