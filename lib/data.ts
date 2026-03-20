export interface Movie {
  id: string
  titulo: string
  descripcion: string
  duracion: number
  genero: string
  clasificacion: string
  imagenUrl: string
  trailerUrl?: string
  estado: 'activa' | 'inactiva'
}

export interface Funcion {
  id: string
  peliculaId: string
  fecha: string
  hora: string
  sala: string
  precio: number
  estado: 'disponible' | 'cancelada'
}

export interface Asiento {
  id: string
  numero: number
  fila: string
  columna: number
  estado: 'disponible' | 'ocupado' | 'seleccionado'
}

export interface Tiquete {
  id: string
  codigo: string
  funcionId: string
  fechaCompra: string
  total: number
  asientos: string[]
  estado: 'activo' | 'usado' | 'cancelado'
}

// Datos de ejemplo para películas
export const peliculas: Movie[] = [
  {
    id: '1',
    titulo: 'Dune: Parte Dos',
    descripcion: 'Paul Atreides se une a los Fremen para vengarse de los conspiradores que destruyeron a su familia. Mientras enfrenta una elección entre el amor de su vida y el destino del universo conocido.',
    duracion: 166,
    genero: 'Ciencia Ficción',
    clasificacion: '+13',
    imagenUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop',
    estado: 'activa'
  },
  {
    id: '2',
    titulo: 'Oppenheimer',
    descripcion: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
    duracion: 180,
    genero: 'Drama',
    clasificacion: '+16',
    imagenUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop',
    estado: 'activa'
  },
  {
    id: '3',
    titulo: 'Guardianes del Tiempo',
    descripcion: 'Un grupo de viajeros del tiempo debe proteger la línea temporal de una amenaza que podría destruir toda la existencia.',
    duracion: 142,
    genero: 'Acción',
    clasificacion: '+13',
    imagenUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
    estado: 'activa'
  },
  {
    id: '4',
    titulo: 'El Último Samurái',
    descripcion: 'Una épica historia de honor, lealtad y redención en el Japón del siglo XIX.',
    duracion: 154,
    genero: 'Drama',
    clasificacion: '+16',
    imagenUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop',
    estado: 'activa'
  },
  {
    id: '5',
    titulo: 'Cosmos: El Viaje',
    descripcion: 'Una expedición espacial descubre señales de vida inteligente más allá de nuestro sistema solar.',
    duracion: 138,
    genero: 'Ciencia Ficción',
    clasificacion: 'TP',
    imagenUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop',
    estado: 'activa'
  },
  {
    id: '6',
    titulo: 'Sombras del Pasado',
    descripcion: 'Un detective retirado debe enfrentar los fantasmas de su pasado cuando un caso sin resolver resurge.',
    duracion: 125,
    genero: 'Thriller',
    clasificacion: '+18',
    imagenUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    estado: 'activa'
  }
]

// Funciones de ejemplo
export const funciones: Funcion[] = [
  { id: 'f1', peliculaId: '1', fecha: '2026-03-20', hora: '14:30', sala: 'Sala 1', precio: 15000, estado: 'disponible' },
  { id: 'f2', peliculaId: '1', fecha: '2026-03-20', hora: '17:00', sala: 'Sala 1', precio: 15000, estado: 'disponible' },
  { id: 'f3', peliculaId: '1', fecha: '2026-03-20', hora: '20:30', sala: 'Sala 1', precio: 18000, estado: 'disponible' },
  { id: 'f4', peliculaId: '2', fecha: '2026-03-20', hora: '15:00', sala: 'Sala 2', precio: 15000, estado: 'disponible' },
  { id: 'f5', peliculaId: '2', fecha: '2026-03-20', hora: '19:00', sala: 'Sala 2', precio: 18000, estado: 'disponible' },
  { id: 'f6', peliculaId: '3', fecha: '2026-03-20', hora: '16:00', sala: 'Sala 3', precio: 12000, estado: 'disponible' },
  { id: 'f7', peliculaId: '3', fecha: '2026-03-20', hora: '21:00', sala: 'Sala 3', precio: 15000, estado: 'disponible' },
  { id: 'f8', peliculaId: '4', fecha: '2026-03-21', hora: '14:00', sala: 'Sala 1', precio: 12000, estado: 'disponible' },
  { id: 'f9', peliculaId: '5', fecha: '2026-03-21', hora: '17:30', sala: 'Sala 2', precio: 15000, estado: 'disponible' },
  { id: 'f10', peliculaId: '6', fecha: '2026-03-21', hora: '20:00', sala: 'Sala 3', precio: 18000, estado: 'disponible' },
]

// Generar asientos (150 sillas: 10 filas x 15 columnas)
export function generarAsientos(): Asiento[] {
  const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
  const asientos: Asiento[] = []
  let numero = 1

  for (const fila of filas) {
    for (let columna = 1; columna <= 15; columna++) {
      asientos.push({
        id: `${fila}${columna}`,
        numero: numero++,
        fila,
        columna,
        estado: Math.random() > 0.75 ? 'ocupado' : 'disponible'
      })
    }
  }

  return asientos
}

// Función para formatear precio en COP
export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(precio)
}

// Función para generar código único de tiquete
export function generarCodigoTiquete(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let codigo = 'TKT-'
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return codigo
}
