'use client'

import Link from 'next/link'
import { Film, Ticket, LayoutDashboard, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            CinePlex
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Cartelera
            </Button>
          </Link>
          <Link href="/funciones">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Funciones
            </Button>
          </Link>
          <Link href="/validar">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Ticket className="mr-2 h-4 w-4" />
              Validar Tiquete
            </Button>
          </Link>
          <Link href="/admin">
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
            <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
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
