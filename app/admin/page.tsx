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
  
  // Image upload states
  const [newMovieImage, setNewMovieImage] = useState<File | null>(null)
  const [newMovieImagePreview, setNewMovieImagePreview] = useState<string>('')
  const [editMovieImage, setEditMovieImage] = useState<File | null>(null)
  const [editMovieImagePreview, setEditMovieImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Edit movie states
  const [editMovie, setEditMovie] = useState<Movie | null>(null)
  const [editMovieDialogOpen, setEditMovieDialogOpen] = useState(false)
  
  // Room management states
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [roomSeats, setRoomSeats] = useState<{row: string, number: number, status: string}[]>([])
  
  // Sales filter
  const [salesMovieFilter, setSalesMovieFilter] = useState<string>('all')

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

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true)
    try {
      const base64 = await toBase64(file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      return data.url
    } finally {
      setUploadingImage(false)
    }
  }

  const handleNewMovieImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewMovieImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewMovieImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditMovieImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditMovieImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditMovieImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddMovie = async () => {
    setSaving(true)
    try {
      let posterUrl = newMovie.poster_url
      
      // Upload image if selected
      if (newMovieImage) {
        posterUrl = await uploadImage(newMovieImage)
      }
      
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMovie,
          poster_url: posterUrl,
          duration: parseInt(newMovie.duration)
        })
      })
      
      if (res.ok) {
        setMovieDialogOpen(false)
        setNewMovie({ title: '', genre: '', duration: '', rating: '', synopsis: '', poster_url: '', release_date: '' })
        setNewMovieImage(null)
        setNewMovieImagePreview('')
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

  const handleEditMovie = (movie: Movie) => {
    setEditMovie(movie)
    setEditMovieDialogOpen(true)
  }

  const handleUpdateMovie = async () => {
    if (!editMovie) return
    setSaving(true)
    try {
      let posterUrl = editMovie.poster_url
      
      // Upload new image if selected
      if (editMovieImage) {
        posterUrl = await uploadImage(editMovieImage)
      }
      
      const res = await fetch(`/api/movies/${editMovie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editMovie.title,
          genre: editMovie.genre,
          duration: editMovie.duration,
          rating: editMovie.rating,
          synopsis: editMovie.synopsis,
          poster_url: posterUrl,
          trailer_url: editMovie.trailer_url,
          release_date: editMovie.release_date,
          is_active: editMovie.is_active
        })
      })
      
      if (res.ok) {
        setEditMovieDialogOpen(false)
        setEditMovie(null)
        setEditMovieImage(null)
        setEditMovieImagePreview('')
        fetchData()
      }
    } catch (error) {
      console.error('Error updating movie:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRoomSelect = async (room: Room) => {
    setSelectedRoom(room)
    // Fetch tickets for this room to see occupied seats
    try {
      const res = await fetch('/api/tickets')
      if (res.ok) {
        const allTickets = await res.json()
        // Generate seat map
        const seats: {row: string, number: number, status: string}[] = []
        const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, room.rows_count)
        for (const row of rows) {
          for (let num = 1; num <= room.seats_per_row; num++) {
            const hasTicket = allTickets.some((t: Ticket) => 
              t.seat_row === row && t.seat_number === num
            )
            seats.push({
              row,
              number: num,
              status: hasTicket ? 'occupied' : 'available'
            })
          }
        }
        setRoomSeats(seats)
      }
    } catch (error) {
      console.error('Error fetching room seats:', error)
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
          <TabsList className="mb-8 grid w-full grid-cols-5 bg-secondary md:w-auto md:grid-cols-5">
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
            <TabsTrigger value="salas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Salas</span>
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Poster de la película</label>
                      <Input 
                        type="file" 
                        accept="image/*"
                        className="border-border bg-input"
                        onChange={handleNewMovieImageChange}
                      />
                      {newMovieImagePreview && (
                        <div className="mt-2">
                          <img 
                            src={newMovieImagePreview} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg border border-border"
                          />
                        </div>
                      )}
                    </div>
                    <Input 
                      type="date" 
                      className="border-border bg-input"
                      value={newMovie.release_date}
                      onChange={(e) => setNewMovie({...newMovie, release_date: e.target.value})}
                    />
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleAddMovie}
                      disabled={saving || uploadingImage}
                    >
                      {(saving || uploadingImage) ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Guardar Película
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {movies.map((movie) => (
                <Card key={movie.id} className="border-border bg-card overflow-hidden">
                  {movie.poster_url && (
                    <div className="relative h-48 w-full">
                      <img 
                        src={movie.poster_url} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-border"
                        onClick={() => handleEditMovie(movie)}
                      >
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

          {/* Edit Movie Dialog */}
          <Dialog open={editMovieDialogOpen} onOpenChange={setEditMovieDialogOpen}>
            <DialogContent className="border-border bg-card max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">Editar Película</DialogTitle>
                <DialogDescription>
                  Modifica los datos de la película.
                </DialogDescription>
              </DialogHeader>
              {editMovie && (
                <div className="grid gap-4 py-4">
                  <Input 
                    placeholder="Título de la película" 
                    className="border-border bg-input"
                    value={editMovie.title}
                    onChange={(e) => setEditMovie({...editMovie, title: e.target.value})}
                  />
                  <Textarea 
                    placeholder="Sinopsis" 
                    className="border-border bg-input"
                    value={editMovie.synopsis}
                    onChange={(e) => setEditMovie({...editMovie, synopsis: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Duración (min)" 
                      type="number" 
                      className="border-border bg-input"
                      value={editMovie.duration}
                      onChange={(e) => setEditMovie({...editMovie, duration: parseInt(e.target.value)})}
                    />
                    <Select 
                      value={editMovie.genre} 
                      onValueChange={(v) => setEditMovie({...editMovie, genre: v})}
                    >
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
                  <Select 
                    value={editMovie.rating} 
                    onValueChange={(v) => setEditMovie({...editMovie, rating: v})}
                  >
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Poster de la película</label>
                    {editMovie.poster_url && !editMovieImagePreview && (
                      <div className="mb-2">
                        <img 
                          src={editMovie.poster_url} 
                          alt="Poster actual" 
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                      </div>
                    )}
                    <Input 
                      type="file" 
                      accept="image/*"
                      className="border-border bg-input"
                      onChange={handleEditMovieImageChange}
                    />
                    {editMovieImagePreview && (
                      <div className="mt-2">
                        <img 
                          src={editMovieImagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                      </div>
                    )}
                  </div>
                  <Input 
                    type="date" 
                    className="border-border bg-input"
                    value={editMovie.release_date}
                    onChange={(e) => setEditMovie({...editMovie, release_date: e.target.value})}
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="is_active"
                      checked={editMovie.is_active}
                      onChange={(e) => setEditMovie({...editMovie, is_active: e.target.checked})}
                      className="h-4 w-4"
                    />
                    <label htmlFor="is_active" className="text-sm text-foreground">
                      Película activa (visible en cartelera)
                    </label>
                  </div>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleUpdateMovie}
                    disabled={saving || uploadingImage}
                  >
                    {(saving || uploadingImage) ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

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

          {/* Rooms Tab */}
          <TabsContent value="salas" className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Administración de Salas</h2>
            
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Room List */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Salas Disponibles</CardTitle>
                  <CardDescription>Selecciona una sala para ver sus asientos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rooms.map((room) => (
                    <div 
                      key={room.id}
                      className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleRoomSelect(room)}
                    >
                      <div>
                        <p className="font-medium text-foreground">{room.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {room.rows_count} filas x {room.seats_per_row} asientos
                        </p>
                      </div>
                      <Badge variant="outline">{room.total_seats} asientos</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Seat Map */}
              <Card className="border-border bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    {selectedRoom ? `Asientos - ${selectedRoom.name}` : 'Selecciona una sala'}
                  </CardTitle>
                  <CardDescription>
                    Visualiza el estado de los asientos en cada sala
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedRoom ? (
                    <div className="space-y-4">
                      {/* Screen indicator */}
                      <div className="mx-auto w-3/4 rounded-lg bg-gradient-to-r from-transparent via-primary/30 to-transparent py-2 text-center text-xs text-muted-foreground">
                        PANTALLA
                      </div>
                      
                      {/* Seat grid */}
                      <div className="flex flex-col items-center gap-2">
                        {Array.from(new Set(roomSeats.map(s => s.row))).map((row) => (
                          <div key={row} className="flex items-center gap-1">
                            <span className="w-6 text-xs text-muted-foreground">{row}</span>
                            <div className="flex gap-1">
                              {roomSeats
                                .filter(s => s.row === row)
                                .sort((a, b) => a.number - b.number)
                                .map((seat) => (
                                  <div
                                    key={`${seat.row}${seat.number}`}
                                    className={`h-8 w-8 rounded-t-lg text-xs flex items-center justify-center ${
                                      seat.status === 'occupied'
                                        ? 'bg-destructive/50 text-destructive-foreground cursor-not-allowed'
                                        : 'bg-cinema-green/50 text-cinema-green hover:bg-cinema-green'
                                    }`}
                                    title={`Asiento ${seat.row}${seat.number} - ${seat.status === 'occupied' ? 'Ocupado' : 'Disponible'}`}
                                  >
                                    {seat.number}
                                  </div>
                                ))}
                            </div>
                            <span className="w-6 text-xs text-muted-foreground">{row}</span>
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="flex justify-center gap-6 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-cinema-green/50"></div>
                          <span className="text-sm text-muted-foreground">Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-destructive/50"></div>
                          <span className="text-sm text-muted-foreground">Ocupado</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 flex justify-center gap-8 border-t pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-cinema-green">
                            {roomSeats.filter(s => s.status === 'available').length}
                          </p>
                          <p className="text-xs text-muted-foreground">Disponibles</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-destructive">
                            {roomSeats.filter(s => s.status === 'occupied').length}
                          </p>
                          <p className="text-xs text-muted-foreground">Ocupados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{roomSeats.length}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center">
                      <p className="text-muted-foreground">Selecciona una sala para ver sus asientos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="ventas" className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Historial de Ventas</h2>
            
            {/* Filter by movie */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Filtrar por Película</CardTitle>
                <CardDescription>Ver tickets vendidos por película específica</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={salesMovieFilter} onValueChange={setSalesMovieFilter}>
                    <SelectTrigger className="border-border bg-input w-full md:w-[300px]">
                      <SelectValue placeholder="Todas las películas" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="all">Todas las películas</SelectItem>
                      {movies.map((movie) => (
                        <SelectItem key={movie.id} value={movie.id.toString()}>
                          {movie.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

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
                    {tickets
                      .filter(ticket => salesMovieFilter === 'all' || (ticket as any).movie_id?.toString() === salesMovieFilter)
                      .map((ticket) => (
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
