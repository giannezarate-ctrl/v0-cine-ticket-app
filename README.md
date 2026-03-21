# 🎬 CinePlex - Sistema de Gestión de Cine y Venta de Tiquetes

## Descripción del Proyecto

**CinePlex** es una aplicación web completa para la gestión de cartelera de cine y venta de tiquetes, construida con tecnologías modernas de desarrollo web. El sistema permite a los usuarios explorar películas en cartelera, seleccionar funciones, elegir asientos y comprar tiquetes. Además, incluye un panel de administración para gestionar el contenido y visualizar estadísticas.

Esta aplicación fue generada con [v0](https://v0.app) y utiliza [Next.js](https://nextjs.org) como framework principal.

---

## 🛠️ Tecnologías y Dependencias

### Framework Principal
- **Next.js 16.2.0** - Framework React con renderizado del lado del servidor (SSR) y estático
- **React 19.2.4** - Biblioteca de interfaces de usuario
- **TypeScript 5.7.3** - Tipado estático para JavaScript

### Estilizado y UI
- **Tailwind CSS 4.2.0** - Framework de utilidades CSS
- **Radix UI** - Componentes UI accesibles y sin estilo (más de 30 componentes)
- **Lucide React 0.564.0** - Iconos
- **Recharts 2.15.0** - Gráficos y visualizaciones
- **Embla Carousel** - Carruseles touch-friendly

### Base de Datos
- **Neon Serverless** - Base de datos PostgreSQL sin servidor
- **pg** - Driver de PostgreSQL para Node.js
- **pgcrypto** - Extensión PostgreSQL para generación de UUIDs

### Validación y Formularios
- **React Hook Form** - Gestión de formularios
- **Zod 3.24.1** - Validación de esquemas
- **@hookform/resolvers** - Integración de Zod con React Hook Form

### Utilidades
- **date-fns 4.1.0** - Manipulación de fechas
- **SWR 2.4.1** - Fetch de datos con caché
- **next-themes 0.4.6** - Soporte para temas claro/oscuro
- **Vercel Analytics** - Análisis y métricas
- **Tailwind Merge & CLSX** - Utilidades para clases CSS

---

## 🗄️ Estructura de la Base de Datos

El proyecto utiliza PostgreSQL con las siguientes tablas:

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `movies` | Catálogo de películas |
| `users` | Usuarios del sistema (administradores y clientes) |
| `rooms` | Salas del cine |
| `seats` | Asientos por sala |
| `showtimes` | Funciones/honorarios de películas |
| `showtime_seats` | Estado de asientos por función |
| `tickets` | Tiquetes comprados |
| `ticket_seats` | Relación tiquetes-asientos |

### Esquema Detallado

```sql
-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 🎬 MOVIES - Películas
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    duration INT, -- minutos
    rating VARCHAR(10),
    synopsis TEXT,
    poster_url TEXT,
    trailer_url TEXT,
    release_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 👤 USERS - Usuarios (admin + cliente)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'client')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🏢 ROOMS - Salas
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🪑 SEATS - Asientos por sala
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    row CHAR(1),
    number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎬 SHOWTIMES - Funciones
CREATE TABLE showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id),
    start_time TIMESTAMP NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔥 ESTADO DE ASIENTOS POR FUNCIÓN
CREATE TABLE showtime_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showtime_id UUID REFERENCES showtimes(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id),
    status VARCHAR(20) DEFAULT 'available' 
        CHECK (status IN ('available', 'reserved', 'sold')),
    UNIQUE(showtime_id, seat_id)
);

-- 🎟️ TICKETS - Tiquetes
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    showtime_id UUID REFERENCES showtimes(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'used', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎟️ RELACIÓN TICKET - ASIENTOS
CREATE TABLE ticket_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id)
);
```

---

## 📁 Estructura del Proyecto

```
v0-cine-ticket-app/
├── app/                          # Directorio principal de la aplicación
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Componente raíz de la aplicación
│   ├── page.tsx                  # Página principal (Home)
│   │
│   ├── api/                      # Rutas de la API REST
│   │   ├── funciones/            # API de funciones cinematográficas
│   │   ├── movies/               # API de películas
│   │   ├── rooms/                # API de salas
│   │   ├── showtimes/            # API de horarios de funciones
│   │   ├── stats/                # API de estadísticas
│   │   └── tickets/              # API de tiquetes y validación
│   │
│   ├── admin/                    # Panel de administración
│   │   ├── login/                # Página de inicio de sesión
│   │   └── page.tsx              # Dashboard principal del admin
│   │
│   ├── funciones/               # Página de funciones/películas
│   ├── pelicula/[id]/            # Página de detalle de película
│   └── validar/                  # Página de validación de tiquetes
│
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes base de Radix UI
│   │   ├── button.tsx            # Botones
│   │   ├── card.tsx              # Tarjetas
│   │   ├── dialog.tsx            # Diálogos modales
│   │   ├── dropdown-menu.tsx     # Menús desplegables
│   │   ├── select.tsx            # Selectores
│   │   ├── table.tsx             # Tablas
│   │   ├── tabs.tsx              # Pestañas
│   │   ├── toast.tsx             # Notificaciones toast
│   │   ├── chart.tsx             # Gráficos
│   │   ├── calendar.tsx          # Calendario
│   │   └── ... (más de 40 componentes)
│   │
│   ├── header.tsx                # Encabezado de navegación
│   ├── hero-section.tsx          # Sección hero principal
│   ├── movie-card.tsx            # Tarjeta de película
│   ├── seat-selector.tsx         # Selector de asientos
│   ├── ticket-modal.tsx          # Modal de tiquete
│   └── theme-provider.tsx        # Proveedor de temas
│
├── lib/                          # Utilidades y configuración
│   ├── data.ts                   # Interfaces TypeScript y datos de ejemplo
│   ├── db.ts                     # Configuración de conexión a Neon
│   └── utils.ts                  # Utilidades CSS
│
├── hooks/                        # Hooks personalizados
│   ├── use-mobile.ts             # Detección de dispositivos móviles
│   └── use-toast.ts              # Sistema de notificaciones
│
├── public/                       # Archivos estáticos
│   ├── icon.svg                  # Icono de la aplicación
│   ├── placeholder*.jpg/svg      # Imágenes placeholder
│   └── apple-icon.png            # Icono para Apple
│
├── scripts/                      # Scripts de base de datos
│   ├── 001-create-tables.sql     # Creación inicial de tablas
│   ├── 002-recreate-tables.sql   # Recrear tablas
│   ├── 003-fix-schema.sql        # Correcciones de esquema
│   └── add-movies.js             # Script para agregar películas
│
├── styles/
│   └── globals.css               # Estilos globales adicionales
│
└── Archivos de configuración
    ├── package.json              # Dependencias y scripts
    ├── tsconfig.json             # Configuración de TypeScript
    ├── next.config.mjs           # Configuración de Next.js
    ├── tailwind.config.*         # Configuración de Tailwind
    ├── postcss.config.mjs        # Configuración de PostCSS
    └── vercel.json               # Configuración de despliegue
```

---

## 📄 Páginas de la Aplicación

### Página Principal (`/`)
- Muestra las películas en cartelera
- Sección hero con películas destacadas
- Navegación a otras secciones del sitio

### Funciones (`/funciones`)
- Lista completa de funciones disponibles
- Filtros por fecha, género y sala
- Selección de función para compra de tiquetes

### Detalle de Película (`/pelicula/[id]`)
- Información detallada de cada película
- Sinopsis, duración, clasificación por edad
- Horarios disponibles y compra de tiquetes

### Validar Tiquete (`/validar`)
- Sistema de validación de tiquetes adquiridos
- Verificación de código de tiquete
- Estados: activo, usado, cancelado

### Panel de Administración (`/admin`)
- **Dashboard**: Estadísticas y métricas del cine
- **Gestión de Películas**: CRUD completo de películas
- **Gestión de Funciones**: Crear/modificar horarios de funciones
- **Gestión de Salas**: Administrar salas y asientos
- **Reportes**: Visualización de ventas y ocupación

### Inicio de Sesión Admin (`/admin/login`)
- Autenticación segura para administradores

---

## 🔌 Rutas de API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/movies` | GET, POST | Obtener todas las películas / Crear película |
| `/api/movies/[id]` | GET, PUT, DELETE | Gestionar película específica |
| `/api/funciones` | GET | Obtener todas las funciones |
| `/api/showtimes` | GET, POST | Obtener/Crear horarios de funciones |
| `/api/showtimes/[id]/seats` | GET | Obtener asientos de una función |
| `/api/tickets` | GET, POST | Obtener/Crear tiquetes |
| `/api/tickets/validate` | POST | Validar tiquete por código |
| `/api/rooms` | GET | Obtener salas disponibles |
| `/api/stats` | GET | Obtener estadísticas del cine |

---

## 🎨 Interfaces TypeScript

### Película (Movie)
```typescript
{
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
```

### Función (Funcion)
```typescript
{
  id: string
  peliculaId: string
  fecha: string
  hora: string
  sala: string
  precio: number
  estado: 'disponible' | 'cancelada'
}
```

### Asiento (Asiento)
```typescript
{
  id: string
  numero: number
  fila: string
  columna: number
  estado: 'disponible' | 'ocupado' | 'seleccionado'
}
```

### Tiquete (Tiquete)
```typescript
{
  id: string
  codigo: string
  funcionId: string
  fechaCompra: string
  total: number
  asientos: string[]
  estado: 'activo' | 'usado' | 'cancelado'
}
```

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos Previos
- Node.js 18.x o superior
- pnpm, npm o yarn (el proyecto usa pnpm por defecto)
- Cuenta en [Neon](https://neon.tech) para la base de datos PostgreSQL

### Configuración de Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Conexión a Neon Database
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require
```

### Instalación

```bash
# Instalar dependencias
pnpm install
# o
npm install
```

### Ejecutar en Desarrollo

```bash
pnpm dev
# o
npm run dev
# o
yarn dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Configurar Base de Datos

Ejecuta los scripts SQL en orden para crear las tablas:

```bash
# Conectate a tu base de datos Neon y ejecuta:
psql $DATABASE_URL -f scripts/001-create-tables.sql
```

### Construcción para Producción

```bash
pnpm build
# o
npm run build
```

### Iniciar Servidor de Producción

```bash
pnpm start
# o
npm start
```

---

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo |
| `pnpm build` | Construye la aplicación para producción |
| `pnpm start` | Inicia el servidor de producción |
| `pnpm lint` | Ejecuta el linter para verificar código |

---

## 🎯 Características Principales

1. **Exploración de Películas** - Navegación intuitiva por el catálogo de películas con filtros
2. **Selección de Asientos** - Interfaz visual interactiva para elegir asientos en la sala
3. **Compra de Tiquetes** - Proceso completo de compra con generación de códigos únicos
4. **Validación de Tiquetes** - Sistema para verificar tiquetes en la entrada del cine
5. **Panel de Administración** - Dashboard completo para gestión del cine
6. **Sistema de Temas** - Soporte para modo claro y oscuro
7. **Diseño Responsivo** - Adaptable a dispositivos móviles y escritorio
8. **Base de Datos Relacional** - Almacenamiento persistente con PostgreSQL

---

## 📊 Estadísticas del Proyecto

- **Componentes UI**: Más de 40 componentes de Radix UI
- **Rutas de API**: 9 endpoints REST
- **Páginas**: 6 páginas principales
- **Tablas de BD**: 8 tablas PostgreSQL
- **Estado**: Tema oscuro por defecto

---

## 📁 Archivos de Scripts de Base de Datos

| Archivo | Descripción |
|---------|-------------|
| `001-create-tables.sql` | Creación inicial de todas las tablas |
| `002-recreate-tables.sql` | Recrear tablas (drop y create) |
| `003-fix-schema.sql` | Correcciones al esquema |
| `add-movies.js` | Script Node.js para insertar películas de ejemplo |

---

## 📄 Licencia

Este proyecto fue creado con [v0](https://v0.app) y está disponible para desarrollo y aprendizaje.

---

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de v0](https://v0.app/docs)
- [Radix UI Components](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Neon Database](https://neon.tech)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
