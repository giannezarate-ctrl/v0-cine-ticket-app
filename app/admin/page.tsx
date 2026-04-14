'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
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
  LogIn,
  AlertCircle,
  ChevronLeft,
  ChevronRight
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
  const { toast } = useToast()
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
  const [showtimeError, setShowtimeError] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedRoomForCalendar, setSelectedRoomForCalendar] = useState<string>('')

  const timeOptions = Array.from({ length: 14 }, (_, i) => {
    const hour = (10 + i).toString().padStart(2, '0')
    return { value: `${hour}:00`, label: `${hour}:00` }
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const getShowtimesForDay = (dateStr: string) => {
    if (!selectedRoomForCalendar) return []
    return showtimes.filter(s => s.room_id === selectedRoomForCalendar && s.show_date === dateStr)
  }

  const hasShowtimes = (dateStr: string) => getShowtimesForDay(dateStr).length > 0

  const formatTime = (time: string) => time

  const checkTimeSlotBlocked = (startHour: number, duration: number, existingShowtimes: any[]): { blocked: boolean; conflictingMovie?: string } => {
    if (!existingShowtimes || existingShowtimes.length === 0) return { blocked: false }
    
    const startMinutes = startHour * 60
    const endMinutes = startMinutes + duration
    
    for (const show of existingShowtimes) {
      const [sh, sm = 0] = show.show_time.split(':').map(Number)
      const existStart = sh * 60 + sm
      const existMovie = movies.find(m => m.id === show.movie_id)
      const existDuration = existMovie?.duration || 120
      const existEnd = existStart + existDuration
      
      if (startMinutes < existEnd && endMinutes > existStart) {
        return { blocked: true, conflictingMovie: existMovie?.title || 'Otra' }
      }
    }
    return { blocked: false }
  }

  const getDateStr = (day: number) => {
    const year = calendarMonth.getFullYear()
    const month = String(calendarMonth.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${month}-${dayStr}`
  }
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
  
  // Edit showtime states
  const [editShowtime, setEditShowtime] = useState<Showtime | null>(null)
  const [editShowtimeDialogOpen, setEditShowtimeDialogOpen] = useState(false)
  
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
      const showtimesData = await showtimesRes.json()
      console.log('[ADMIN] Showtimes loaded:', showtimesData.length, showtimesData.map((s: any) => ({ id: s.id, movie: s.movie_title, date: s.show_date, time: s.show_time })))
      if (showtimesRes.ok) setShowtimes(showtimesData)
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
        toast({
          title: 'Película creada',
          description: `${newMovie.title} ha sido agregada exitosamente.`,
        })
        setMovieDialogOpen(false)
        setNewMovie({ title: '', genre: '', duration: '', rating: '', synopsis: '', poster_url: '', release_date: '' })
        setNewMovieImage(null)
        setNewMovieImagePreview('')
        fetchData()
      } else {
        const data = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo crear la película',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al crear la película',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddShowtime = async () => {
    setSaving(true)
    setShowtimeError(null)
    try {
      if (!newShowtime.movie_id || !newShowtime.room_id || !newShowtime.show_date || !newShowtime.show_time) {
        setShowtimeError('Todos los campos son obligatorios')
        setSaving(false)
        return
      }

      const movie = movies.find(m => m.id === newShowtime.movie_id)
      const existingInRoomAndDate = showtimes.filter(s => 
        s.room_id === newShowtime.room_id && 
        s.show_date === newShowtime.show_date
      )

      if (movie) {
        const [hh, mm = 0] = newShowtime.show_time.split(':').map(Number)
        const startHour = hh + (mm / 60)
        const check = checkTimeSlotBlocked(startHour, movie.duration || 120, existingInRoomAndDate)
        if (check.blocked) {
          setShowtimeError(`La función se cruza con otra película programada (${check.conflictingMovie}).`)
          setSaving(false)
          return
        }
      }

      const res = await fetch('/api/showtimes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newShowtime,
          movie_id: newShowtime.movie_id,
          room_id: newShowtime.room_id,
          price: parseInt(newShowtime.price)
        })
      })
      
      if (res.ok) {
        toast({
          title: 'Función creada',
          description: 'La función ha sido programada exitosamente.',
        })
        setShowtimeDialogOpen(false)
        setNewShowtime({ movie_id: '', room_id: '', show_date: '', show_time: '', price: '' })
        fetchData()
      } else {
        const data = await res.json()
        setShowtimeError(data.error || 'No se pudo crear la función')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al crear la función',
      })
    } finally {
      setSaving(false)
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
        toast({
          title: 'Película actualizada',
          description: `${editMovie.title} ha sido actualizada exitosamente.`,
        })
        setEditMovieDialogOpen(false)
        setEditMovie(null)
        setEditMovieImage(null)
        setEditMovieImagePreview('')
        fetchData()
      } else {
        const data = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo actualizar la película',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al actualizar la película',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMovie = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta película?')) return
    
    try {
      const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({
          title: 'Película eliminada',
          description: 'La película ha sido eliminada exitosamente.',
        })
        fetchData()
      } else {
        const data = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo eliminar la película',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al eliminar la película',
      })
    }
  }

  const handleDeleteShowtime = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta función? Esto también eliminará los tickets asociados a ella.')) return
    
    try {
      const res = await fetch(`/api/showtimes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({
          title: 'Función eliminada',
          description: 'La función ha sido eliminada exitosamente.',
        })
        fetchData()
      } else {
        const data = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo eliminar la función',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al eliminar la función',
      })
    }
  }

  const handleEditShowtime = (showtime: Showtime) => {
    setEditShowtime(showtime)
    setEditShowtimeDialogOpen(true)
  }

  const handleUpdateShowtime = async () => {
    if (!editShowtime) return
    setSaving(true)
    try {
      const movie = movies.find(m => m.id === editShowtime.movie_id)
      const existingInRoomAndDate = showtimes.filter(s => 
        s.room_id === editShowtime.room_id && 
        s.show_date === editShowtime.show_date &&
        s.id !== editShowtime.id
      )

      if (movie) {
        const [hh, mm = 0] = editShowtime.show_time.split(':').map(Number)
        const startHour = hh + (mm / 60)
        const check = checkTimeSlotBlocked(startHour, movie.duration || 120, existingInRoomAndDate)
        if (check.blocked) {
          toast({
            variant: 'destructive',
            title: 'Cruce de horarios',
            description: `La función se cruza con otra película programada (${check.conflictingMovie}).`
          })
          setSaving(false)
          return
        }
      }

      const res = await fetch(`/api/showtimes/${editShowtime.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_date: editShowtime.show_date,
          show_time: editShowtime.show_time,
          price: editShowtime.price
        })
      })
      
      if (res.ok) {
        toast({
          title: 'Función actualizada',
          description: 'La función ha sido actualizada exitosamente.',
        })
        setEditShowtimeDialogOpen(false)
        setEditShowtime(null)
        fetchData()
      } else {
        const data = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo actualizar la función',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al actualizar la función',
      })
    } finally {
      setSaving(false)
    }
  }


  const handleRoomSelect = async (room: Room) => {
    setSelectedRoom(room)
    setRoomSeats([]) // Clear previous seats
    // Fetch tickets to see occupied seats
    try {
      const res = await fetch('/api/tickets')
      if (res.ok) {
        const allTickets: Ticket[] = await res.json()
        
        // Filter out tickets from old showtimes that already ended (e.g., 2 hours past start time)
        const now = new Date()
        const activeTickets = allTickets.filter(t => {
          if (!t.show_date || !t.show_time) return false
          const showDateTime = new Date(`${t.show_date}T${t.show_time}`)
          // Check if showtime ended (assume it lasts 2 hours)
          const endTime = new Date(showDateTime.getTime() + 2 * 60 * 60 * 1000)
          return endTime > now
        })
        
        // Generate seat map based on room dimensions
        const seats: {row: string, number: number, status: string}[] = []
        const rowsCount = room.rows_count || 10
        const seatsPerRow = room.seats_per_row || 6
        
        const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, rowsCount)
        for (const row of rows) {
          for (let num = 1; num <= seatsPerRow; num++) {
            // Check if this specific seat in this specific room is occupied by an ACTIVE showtime
            const hasTicket = activeTickets.some((t: Ticket) => 
              t.room_name === room.name && t.seat_row === row && t.seat_number === num
            )
            
            seats.push({
              row,
              number: num,
              status: hasTicket ? 'occupied' : 'available'
            })
          }
        }
        setRoomSeats(seats)
      } else {
        console.error('Failed to fetch tickets:', res.statusText)
      }
    } catch (error) {
      console.error('Error fetching room seats:', error)
      // Fallback: show empty seats if fetch fails
      const seats: {row: string, number: number, status: string}[] = []
      const rowsCount = room.rows_count || 10
      const seatsPerRow = room.seats_per_row || 6
      const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, rowsCount)
      for (const row of rows) {
        for (let num = 1; num <= seatsPerRow; num++) {
          seats.push({ row, number: num, status: 'available' })
        }
      }
      setRoomSeats(seats)
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
              <Dialog open={showtimeDialogOpen} onOpenChange={(open) => { setShowtimeDialogOpen(open); if (open) setShowtimeError(null); }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Función
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <Select value={newShowtime.room_id} onValueChange={(v) => { setNewShowtime({...newShowtime, room_id: v}); setSelectedRoomForCalendar(v); }}>
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
                    
                    {/* Calendario Visual */}
                    <div className="border border-border rounded-lg p-4 bg-input/30">
                      <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-foreground">
                          {calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                          <div key={d} className="text-xs text-muted-foreground font-medium">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(calendarMonth).map((day, idx) => {
                          if (!day) return <div key={`empty-${idx}`} />
                          const dateStr = getDateStr(day)
                          const isSelected = newShowtime.show_date === dateStr
                          const hasFunc = hasShowtimes(dateStr)
                          return (
                            <button
                              key={day}
                              onClick={() => setNewShowtime({...newShowtime, show_date: dateStr})}
                              className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all
                                ${isSelected ? 'bg-primary text-primary-foreground font-bold' : ''}
                                ${!isSelected && hasFunc ? 'bg-red-500/80 text-white font-medium' : ''}
                                ${!isSelected && !hasFunc ? 'bg-muted text-muted-foreground hover:bg-muted/80' : ''}
                              `}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                          <span className="text-muted-foreground">Con funciones</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-muted"></div>
                          <span className="text-muted-foreground">Sin funciones</span>
                        </div>
                      </div>
                    </div>

                    {/* Horarios del día seleccionado */}
                    {newShowtime.show_date && newShowtime.room_id && (
                      <div className="border border-border rounded-lg p-4 bg-input/30">
                        <h4 className="text-sm font-semibold text-foreground mb-3">
                          Horarios del {newShowtime.show_date.split('-')[2]} de {calendarMonth.toLocaleDateString('es-ES', { month: 'long' })}
                        </h4>
                        {(() => {
                          const dayShowtimes = getShowtimesForDay(newShowtime.show_date)
                          const selectedMovie = movies.find(m => m.id === newShowtime.movie_id)
                          const selectedDuration = selectedMovie?.duration || 120
                          const allSlots = Array.from({ length: 15 }, (_, i) => 10 + i)
                          
                          return (
                            <div className="space-y-3">
                              {selectedMovie && (
                                <div className="text-xs text-muted-foreground bg-primary/10 p-2 rounded">
                                  <span className="font-semibold">"{selectedMovie.title}"</span> ({selectedDuration} min)
                                </div>
                              )}
                              <div className="grid grid-cols-5 gap-1">
                                {allSlots.map(hour => {
                                  const { blocked, conflictingMovie } = checkTimeSlotBlocked(hour, selectedDuration, dayShowtimes)
                                  const existingShow = dayShowtimes.find(s => {
                                    const [sh] = s.show_time.split(':').map(Number)
                                    return sh === hour
                                  })
                                  
                                  return (
                                    <div
                                      key={hour}
                                      className={`text-xs p-2 rounded text-center transition-all ${
                                        blocked && selectedMovie 
                                          ? 'bg-orange-500/30 text-orange-500 border border-orange-500/50' 
                                          : existingShow 
                                            ? 'bg-red-500/20 text-red-500' 
                                            : 'bg-green-500/20 text-green-500'
                                      }`}
                                    >
                                      <div className="font-bold">{String(hour).padStart(2, '0')}:00</div>
                                      <div className="text-[10px] opacity-70">
                                        {blocked && selectedMovie ? `Choca con ${conflictingMovie?.slice(0, 6)}` : 
                                         existingShow ? existingShow.movie_title?.slice(0, 8) : 'Libre'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded bg-red-500/20"></div>
                                  <span className="text-muted-foreground">Ocupado</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded bg-green-500/20"></div>
                                  <span className="text-muted-foreground">Libre</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded bg-orange-500/30"></div>
                                  <span className="text-muted-foreground">No cabe</span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    <Select value={newShowtime.show_time} onValueChange={(v) => setNewShowtime({...newShowtime, show_time: v})}>
                      <SelectTrigger className="border-border bg-input">
                        <SelectValue placeholder="Selecciona una hora" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {timeOptions.map((t) => {
                          const dayShowtimes = newShowtime.show_date && newShowtime.room_id ? getShowtimesForDay(newShowtime.show_date) : []
                          const selectedMovie = movies.find(m => m.id === newShowtime.movie_id)
                          const selectedDuration = selectedMovie?.duration || 120
                          const [h] = t.value.split(':').map(Number)
                          const { blocked, conflictingMovie } = checkTimeSlotBlocked(h, selectedDuration, dayShowtimes)
                          
                          return (
                            <SelectItem key={t.value} value={t.value} disabled={blocked}>
                              {t.label} {blocked ? `- No cabe (choca con ${conflictingMovie?.slice(0, 10)})` : ''}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>

                    <Input 
                      type="number" 
                      placeholder="Precio" 
                      className="border-border bg-input"
                      value={newShowtime.price}
                      onChange={(e) => setNewShowtime({...newShowtime, price: e.target.value})}
                    />
                    {showtimeError && (
                      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-3">
                          <div className="bg-red-500/20 rounded-full p-2 flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-red-500 text-sm font-semibold">¡Sala Ocupada!</p>
                            <p className="text-muted-foreground text-sm mt-1">{showtimeError}</p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:text-red-500"
                            onClick={() => setShowtimeError(null)}
                          >
                            Entendido
                          </Button>
                        </div>
                      </div>
                    )}
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
                      <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showtimes.map((showtime) => (
                      <TableRow key={showtime.id} className="border-border">
                        <TableCell className="text-foreground">{showtime.movie_title}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(showtime.show_date || '')}</TableCell>
                        <TableCell className="text-muted-foreground">{showtime.show_time}</TableCell>
                        <TableCell className="text-muted-foreground">{showtime.room_name}</TableCell>
                        <TableCell className="text-right font-medium text-cinema-gold">
                          {formatPrice(showtime.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-border"
                              onClick={() => handleEditShowtime(showtime)}
                            >
                              <Pencil className="mr-2 h-3 w-3" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleDeleteShowtime(showtime.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Showtime Dialog */}
            <Dialog open={editShowtimeDialogOpen} onOpenChange={setEditShowtimeDialogOpen}>
              <DialogContent className="border-border bg-card">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Editar / Aplazar Función</DialogTitle>
                  <DialogDescription>
                    Reprograma la fecha y hora de la función o ajusta su precio.
                  </DialogDescription>
                </DialogHeader>
                {editShowtime && (
                  <div className="grid gap-4 py-4">
                    <div className="text-sm font-medium text-foreground mb-2">
                      Película: <span className="text-primary">{editShowtime.movie_title}</span> <br/>
                      Sala: <span className="text-primary">{editShowtime.room_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        type="date" 
                        className="border-border bg-input"
                        value={editShowtime.show_date}
                        onChange={(e) => setEditShowtime({...editShowtime, show_date: e.target.value})}
                      />
                      <Select value={editShowtime.show_time} onValueChange={(v) => setEditShowtime({...editShowtime, show_time: v})}>
                        <SelectTrigger className="border-border bg-input">
                          <SelectValue placeholder="Hora" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          {timeOptions.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input 
                      type="number" 
                      placeholder="Precio" 
                      className="border-border bg-input"
                      value={editShowtime.price}
                      onChange={(e) => setEditShowtime({...editShowtime, price: Number(e.target.value)})}
                    />
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleUpdateShowtime}
                      disabled={saving}
                    >
                      {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Guardar Cambios
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
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
