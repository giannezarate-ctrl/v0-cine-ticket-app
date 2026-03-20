'use client'

import { useState } from 'react'
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
import { peliculas, funciones, formatearPrecio } from '@/lib/data'
import { 
  LayoutDashboard, 
  Film, 
  Calendar, 
  Ticket, 
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  PieChart
} from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Mock stats
  const stats = {
    totalVentas: 2450000,
    tiquetesVendidos: 156,
    ocupacionPromedio: 68,
    funcionesHoy: 10
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
          <Badge variant="outline" className="w-fit border-cinema-green/50 text-cinema-green">
            Sistema Activo
          </Badge>
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
              <Ticket className="mr-2 h-4 w-4" />
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
                    {formatearPrecio(stats.totalVentas)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-cinema-green">+12%</span> vs. semana anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tiquetes Vendidos
                  </CardTitle>
                  <Ticket className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.tiquetesVendidos}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-cinema-green">+8%</span> vs. semana anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ocupación Promedio
                  </CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.ocupacionPromedio}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    De capacidad total
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
                    {stats.funcionesHoy}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En 3 salas activas
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
                    Ventas por Día
                  </CardTitle>
                  <CardDescription>Últimos 7 días</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-[200px] items-end justify-between gap-2">
                    {[65, 45, 78, 52, 90, 68, 85].map((value, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div 
                          className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
                          style={{ height: `${value * 2}px` }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <PieChart className="h-5 w-5 text-accent" />
                    Ocupación por Sala
                  </CardTitle>
                  <CardDescription>Porcentaje de ocupación actual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { sala: 'Sala 1', ocupacion: 75, color: 'bg-primary' },
                      { sala: 'Sala 2', ocupacion: 62, color: 'bg-accent' },
                      { sala: 'Sala 3', ocupacion: 88, color: 'bg-cinema-green' },
                    ].map((item) => (
                      <div key={item.sala} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{item.sala}</span>
                          <span className="text-muted-foreground">{item.ocupacion}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div 
                            className={`h-full rounded-full ${item.color} transition-all`}
                            style={{ width: `${item.ocupacion}%` }}
                          />
                        </div>
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
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Código</TableHead>
                      <TableHead className="text-muted-foreground">Película</TableHead>
                      <TableHead className="text-muted-foreground">Función</TableHead>
                      <TableHead className="text-muted-foreground">Asientos</TableHead>
                      <TableHead className="text-right text-muted-foreground">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { codigo: 'TKT-A1B2C3D4', pelicula: 'Dune: Parte Dos', funcion: '20:30', asientos: 2, total: 36000 },
                      { codigo: 'TKT-E5F6G7H8', pelicula: 'Oppenheimer', funcion: '19:00', asientos: 4, total: 72000 },
                      { codigo: 'TKT-I9J0K1L2', pelicula: 'Guardianes del Tiempo', funcion: '16:00', asientos: 3, total: 36000 },
                    ].map((venta) => (
                      <TableRow key={venta.codigo} className="border-border">
                        <TableCell className="font-mono text-primary">{venta.codigo}</TableCell>
                        <TableCell className="text-foreground">{venta.pelicula}</TableCell>
                        <TableCell className="text-muted-foreground">{venta.funcion}</TableCell>
                        <TableCell className="text-muted-foreground">{venta.asientos}</TableCell>
                        <TableCell className="text-right font-medium text-cinema-gold">
                          {formatearPrecio(venta.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movies Tab */}
          <TabsContent value="peliculas" className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-foreground">Gestión de Películas</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Película
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Agregar Nueva Película</DialogTitle>
                    <DialogDescription>
                      Complete los datos para registrar una nueva película en el sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input placeholder="Título de la película" className="border-border bg-input" />
                    <Textarea placeholder="Descripción" className="border-border bg-input" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Duración (min)" type="number" className="border-border bg-input" />
                      <Select>
                        <SelectTrigger className="border-border bg-input">
                          <SelectValue placeholder="Género" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          <SelectItem value="accion">Acción</SelectItem>
                          <SelectItem value="drama">Drama</SelectItem>
                          <SelectItem value="scifi">Ciencia Ficción</SelectItem>
                          <SelectItem value="thriller">Thriller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Select>
                      <SelectTrigger className="border-border bg-input">
                        <SelectValue placeholder="Clasificación" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="tp">TP - Todo Público</SelectItem>
                        <SelectItem value="+13">+13</SelectItem>
                        <SelectItem value="+16">+16</SelectItem>
                        <SelectItem value="+18">+18</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="URL de imagen" className="border-border bg-input" />
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Guardar Película
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {peliculas.map((movie) => (
                <Card key={movie.id} className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-foreground">{movie.titulo}</CardTitle>
                        <CardDescription className="mt-1">
                          {movie.genero} - {movie.duracion} min
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={movie.estado === 'activa' ? 'default' : 'secondary'}
                        className={movie.estado === 'activa' ? 'bg-cinema-green/20 text-cinema-green' : ''}
                      >
                        {movie.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 border-border">
                        <Pencil className="mr-2 h-3 w-3" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
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
              <Dialog>
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
                    <Select>
                      <SelectTrigger className="border-border bg-input">
                        <SelectValue placeholder="Seleccionar película" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {peliculas.map((movie) => (
                          <SelectItem key={movie.id} value={movie.id}>
                            {movie.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="date" className="border-border bg-input" />
                      <Input type="time" className="border-border bg-input" />
                    </div>
                    <Select>
                      <SelectTrigger className="border-border bg-input">
                        <SelectValue placeholder="Sala" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="sala1">Sala 1</SelectItem>
                        <SelectItem value="sala2">Sala 2</SelectItem>
                        <SelectItem value="sala3">Sala 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Precio" className="border-border bg-input" />
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                      <TableHead className="text-muted-foreground">Precio</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funciones.map((funcion) => {
                      const movie = peliculas.find(p => p.id === funcion.peliculaId)
                      return (
                        <TableRow key={funcion.id} className="border-border">
                          <TableCell className="font-medium text-foreground">
                            {movie?.titulo}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{funcion.fecha}</TableCell>
                          <TableCell className="text-muted-foreground">{funcion.hora}</TableCell>
                          <TableCell className="text-muted-foreground">{funcion.sala}</TableCell>
                          <TableCell className="text-cinema-gold">
                            {formatearPrecio(funcion.precio)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className={funcion.estado === 'disponible' ? 'bg-cinema-green/20 text-cinema-green' : 'bg-destructive/20 text-destructive'}
                            >
                              {funcion.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="ventas" className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Historial de Ventas</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ventas Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cinema-gold">
                    {formatearPrecio(450000)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ventas Esta Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cinema-gold">
                    {formatearPrecio(2450000)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ventas Este Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cinema-gold">
                    {formatearPrecio(8750000)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Todas las Ventas</CardTitle>
                <CardDescription>Registro completo de transacciones</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Código</TableHead>
                      <TableHead className="text-muted-foreground">Película</TableHead>
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground">Asientos</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-right text-muted-foreground">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { codigo: 'TKT-A1B2C3D4', pelicula: 'Dune: Parte Dos', fecha: '2026-03-20', asientos: ['A5', 'A6'], estado: 'activo', total: 36000 },
                      { codigo: 'TKT-E5F6G7H8', pelicula: 'Oppenheimer', fecha: '2026-03-20', asientos: ['C1', 'C2', 'C3', 'C4'], estado: 'usado', total: 72000 },
                      { codigo: 'TKT-I9J0K1L2', pelicula: 'Guardianes del Tiempo', fecha: '2026-03-19', asientos: ['E8', 'E9', 'E10'], estado: 'activo', total: 36000 },
                      { codigo: 'TKT-M3N4O5P6', pelicula: 'Cosmos: El Viaje', fecha: '2026-03-19', asientos: ['B7'], estado: 'usado', total: 15000 },
                      { codigo: 'TKT-Q7R8S9T0', pelicula: 'Sombras del Pasado', fecha: '2026-03-18', asientos: ['D3', 'D4'], estado: 'cancelado', total: 36000 },
                    ].map((venta) => (
                      <TableRow key={venta.codigo} className="border-border">
                        <TableCell className="font-mono text-primary">{venta.codigo}</TableCell>
                        <TableCell className="text-foreground">{venta.pelicula}</TableCell>
                        <TableCell className="text-muted-foreground">{venta.fecha}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {venta.asientos.map(seat => (
                              <Badge key={seat} variant="secondary" className="text-xs">
                                {seat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={
                              venta.estado === 'activo' 
                                ? 'bg-cinema-green/20 text-cinema-green' 
                                : venta.estado === 'usado'
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-destructive/20 text-destructive'
                            }
                          >
                            {venta.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-cinema-gold">
                          {formatearPrecio(venta.total)}
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
