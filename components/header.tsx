'use client'

import Link from 'next/link'
import { Film, Ticket, LayoutDashboard, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Cartelera' },
    { href: '/funciones', label: 'Funciones' },
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
          <Link href="/admin/login" prefetch={false}>
            <Button variant="outline" className="ml-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
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
            <Link href="/validar" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <Ticket className="mr-2 h-4 w-4" />
                Validar Tiquete
              </Button>
            </Link>
            <Link href="/admin/login" onClick={() => setIsMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-start border-primary/50 text-primary">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Panel Admin
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
