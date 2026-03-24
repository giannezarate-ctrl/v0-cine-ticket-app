'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import type { Movie, Showtime, Ticket, Room } from '@/lib/db'
import { 
  LayoutDashboard, 
  Film, 
  Calendar, 
  Ticket as TicketIcon, 
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  PieChart,
  RefreshCw,
  LogOut,
  LogIn
} from 'lucide-react'

interface Stats {
  moviesCount: number
  ticketsToday: number
  totalRevenue: number
  showtimesToday: number
  recentTickets: Ticket[]
  salesByMovie: { title: string; tickets_sold: number; revenue: number }[]
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const isAuthChecked = useRef(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [newMovie, setNewMovie] = useState({
    title: '', genre: '', duration: '', rating: '', synopsis: '', poster_url: '', release_date: ''
  })
  const [newShowtime, setNewShowtime] = useState({
    movie_id: '', room_id: '', show_date: '', show_time: '', price: ''
  })
  const [movieDialogOpen, setMovieDialogOpen] = useState(false)
  const [showtimeDialogOpen, setShowtimeDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, moviesRes, showtimesRes, ticketsRes, roomsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/movies'),
        fetch('/api/showtimes'),
        fetch('/api/tickets'),
        fetch('/api/rooms')
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (moviesRes.ok) setMovies(await moviesRes.json())
      if (showtimesRes.ok) setShowtimes(await showtimesRes.json())
      if (ticketsRes.ok) setTickets(await ticketsRes.json())
      if (roomsRes.ok) setRooms(await roomsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthChecked.current) return
    isAuthChecked.current = true
    
    // Check authentication via API
    fetch('/api/auth?action=me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'admin') {
          setIsAuthenticated(true)
          fetchData()
        } else {
          window.location.href = '/admin/login'
        }
      })
      .catch(() => {
        window.location.href = '/admin/login'
      })
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    })
    router.push('/admin/login')
  }

  const handleAddMovie = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMovie,
          duration: parseInt(newMovie.duration)
        })
      })
      
      if (res.ok) {
        setMovieDialogOpen(false)
        setNewMovie({ title: '', genre: '', duration: '', rating: '', synopsis: '', poster_url: '', release_date: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Error adding movie:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddShowtime = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/showtimes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newShowtime,
          movie_id: parseInt(newShowtime.movie_id),
          room_id: parseInt(newShowtime.room_id),
          price: parseInt(newShowtime.price)
        })
      })
      
      if (res.ok) {
        setShowtimeDialogOpen(false)
        setNewShowtime({ movie_id: '', room_id: '', show_date: '', show_time: '', price: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Error adding showtime:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMovie = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta película?')) return
    
    try {
      const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (error) {
      console.error('Error deleting movie:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                Panel Administrativo
              </h1>
            </div>
            <p className="text-muted-foreground">
              Gestiona películas, funciones y visualiza reportes de ventas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="border-border">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
            <Badge variant="outline" className="border-cinema-green/50 text-cinema-green">
              Sistema Activo
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 grid w-full grid-cols-4 bg-secondary md:w-auto md:grid-cols-4">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="peliculas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Film className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Películas</span>
            </TabsTrigger>
            <TabsTrigger value="funciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Funciones</span>
            </TabsTrigger>
            <TabsTrigger value="ventas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TicketIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ventas</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ventas Totales
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-cinema-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatPrice(stats?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total acumulado
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tiquetes Hoy
                  </CardTitle>
                  <TicketIcon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats?.ticketsToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vendidos hoy
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Películas Activas
                  </CardTitle>
                  <Film className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats?.moviesCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En cartelera
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Funciones Hoy
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-cinema-green" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats?.showtimesToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Programadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Ventas por Película
                  </CardTitle>
                  <CardDescription>Top 5 películas más vendidas</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.salesByMovie && stats.salesByMovie.length > 0 ? (
                    <div className="space-y-4">
                      {stats.salesByMovie.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground truncate max-w-[200px]">{item.title}</span>
                            <span className="text-muted-foreground">{item.tickets_sold} tiquetes</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-secondary">
                            <div 
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min((item.tickets_sold / 50) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay datos de ventas aún</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <PieChart className="h-5 w-5 text-accent" />
                    Salas Disponibles
                  </CardTitle>
                  <CardDescription>Estado de las salas del cine</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <div key={room.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-medium text-foreground">{room.name}</p>
                          <p className="text-sm text-muted-foreground">{room.total_seats} asientos</p>
                        </div>
                        <Badge className="bg-cinema-green/20 text-cinema-green">Activa</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Ventas Recientes</CardTitle>
                <CardDescription>Últimas transacciones realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Código</TableHead>
                        <TableHead className="text-muted-foreground">Película</TableHead>
                        <TableHead className="text-muted-foreground">Cliente</TableHead>
                        <TableHead className="text-muted-foreground">Asiento</TableHead>
                        <TableHead className="text-muted-foreground">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="border-border">
                          <TableCell className="font-mono text-primary">{ticket.ticket_code}</TableCell>
                          <TableCell className="text-foreground">{ticket.movie_title}</TableCell>
                          <TableCell className="text-muted-foreground">{ticket.customer_name}</TableCell>
                          <TableCell className="text-muted-foreground">{ticket.seat_row}{ticket.seat_number}</TableCell>
                          <TableCell>
                            <Badge className={ticket.is_validated ? 'bg-accent/20 text-accent' : 'bg-cinema-green/20 text-cinema-green'}>
                              {ticket.is_validated ? 'Usado' : 'Válido'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No hay ventas recientes</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movies Tab */}
          <TabsContent value="peliculas" className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-foreground">Gestión de Películas</h2>
              <Dialog open={movieDialogOpen} onOpenChange={setMovieDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Película
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border bg-card max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Agregar Nueva Película</DialogTitle>
                    <DialogDescription>
                      Complete los datos para registrar una nueva película en el sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input 
                      placeholder="Título de la película" 
                      className="border-border bg-input"
                      value={newMovie.title}
                      onChange={(e) => setNewMovie({...newMovie, title: e.target.value})}
                    />
                    <Textarea 
                      placeholder="Sinopsis" 
                      className="border-border bg-input"
                      value={newMovie.synopsis}
                      onChange={(e) => setNewMovie({...newMovie, synopsis: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        placeholder="Duración (min)" 
                        type="number" 
                        className="border-border bg-input"
                        value={newMovie.duration}
                        onChange={(e) => setNewMovie({...newMovie, duration: e.target.value})}
                      />
                      <Select value={newMovie.genre} onValueChange={(v) => setNewMovie({...newMovie, genre: v})}>
                        <SelectTrigger className="border-border bg-input">
                          <SelectValue placeholder="Género" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          <SelectItem value="Acción">Acción</SelectItem>
                          <SelectItem value="Drama">Drama</SelectItem>
                          <SelectItem value="Ciencia Ficción">Ciencia Ficción</SelectItem>
                          <SelectItem value="Thriller">Thriller</SelectItem>
                          <SelectItem value="Comedia">Comedia</SelectItem>
                          <SelectItem value="Terror">Terror</SelectItem>
                          <SelectItem value="Animación">Animación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Select value={newMovie.rating} onValueChange={(v) => setNewMovie({...newMovie, rating: v})}>
                      <SelectTrigger className="border-border bg-input">
                        <SelectValue placeholder="Clasificación" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="TP">TP - Todo Público</SelectItem>
                        <SelectItem value="+7">+7</SelectItem>
                        <SelectItem value="+12">+12</SelectItem>
                        <SelectItem value="+15">+15</SelectItem>
                        <SelectItem value="+18">+18</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="URL del poster" 
                      className="border-border bg-input"
                      value={newMovie.poster_url}
                      onChange={(e) => setNewMovie({...newMovie, poster_url: e.target.value})}
                    />
                    <Input 
                      type="date" 
                      className="border-border bg-input"
                      value={newMovie.release_date}
                      onChange={(e) => setNewMovie({...newMovie, release_date: e.target.value})}
                    />
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleAddMovie}
                      disabled={saving}
                    >
                      {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Guardar Película
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {movies.map((movie) => (
                <Card key={movie.id} className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-foreground">{movie.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {movie.genre} - {movie.duration} min
                        </CardDescription>
                      </div>
                      <Badge 
                        className={movie.is_active ? 'bg-cinema-green/20 text-cinema-green' : 'bg-muted text-muted-foreground'}
                      >
                        {movie.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 border-border">
                        <Pencil className="mr-2 h-3 w-3" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteMovie(movie.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Functions Tab */}
          <TabsContent value="funciones" className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-foreground">Programación de Funciones</h2>
              <Dialog open={showtimeDialogOpen} onOpenChange={setShowtimeDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Función
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Programar Nueva Función</DialogTitle>
                    <DialogDescription>
                      Configure los detalles de la nueva función.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Select value={newShowtime.movie_id} onValueChange={(v) => setNewShowtime({...newShowtime, movie_id: v})}>
                      <SelectTrigger className="border-border bg-input">
                        <SelectValue placeholder="Seleccionar película" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {movies.map((movie) => (
                          <SelectItem key={movie.id} value={movie.id.toString()}>
                            {movie.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newShowtime.room_id} onValueChange={(v) => setNewShowtime({...newShowtime, room_id: v})}>
                      <SelectTrigger className="border-border bg-input">
                        <SelectValue placeholder="Sala" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        type="date" 
                        className="border-border bg-input"
                        value={newShowtime.show_date}
                        onChange={(e) => setNewShowtime({...newShowtime, show_date: e.target.value})}
                      />
                      <Input 
                        type="time" 
                        className="border-border bg-input"
                        value={newShowtime.show_time}
                        onChange={(e) => setNewShowtime({...newShowtime, show_time: e.target.value})}
                      />
                    </div>
                    <Input 
                      type="number" 
                      placeholder="Precio" 
                      className="border-border bg-input"
                      value={newShowtime.price}
                      onChange={(e) => setNewShowtime({...newShowtime, price: e.target.value})}
                    />
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleAddShowtime}
                      disabled={saving}
                    >
                      {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Guardar Función
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Película</TableHead>
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground">Hora</TableHead>
                      <TableHead className="text-muted-foreground">Sala</TableHead>
                      <TableHead className="text-right text-muted-foreground">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showtimes.map((showtime) => (
                      <TableRow key={showtime.id} className="border-border">
                        <TableCell className="text-foreground">{showtime.movie_title}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(showtime.show_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{showtime.show_time}</TableCell>
                        <TableCell className="text-muted-foreground">{showtime.room_name}</TableCell>
                        <TableCell className="text-right font-medium text-cinema-gold">
                          {formatPrice(showtime.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="ventas" className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Historial de Ventas</h2>
            
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Código</TableHead>
                      <TableHead className="text-muted-foreground">Película</TableHead>
                      <TableHead className="text-muted-foreground">Cliente</TableHead>
                      <TableHead className="text-muted-foreground">Función</TableHead>
                      <TableHead className="text-muted-foreground">Asiento</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="border-border">
                        <TableCell className="font-mono text-primary">{ticket.ticket_code}</TableCell>
                        <TableCell className="text-foreground">{ticket.movie_title}</TableCell>
                        <TableCell className="text-muted-foreground">{ticket.customer_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {ticket.show_date && formatDate(ticket.show_date)} - {ticket.show_time}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{ticket.seat_row}{ticket.seat_number}</TableCell>
                        <TableCell>
                          <Badge className={ticket.is_validated ? 'bg-accent/20 text-accent' : 'bg-cinema-green/20 text-cinema-green'}>
                            {ticket.is_validated ? 'Validado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
