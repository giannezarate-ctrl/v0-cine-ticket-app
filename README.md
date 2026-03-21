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
│   │   └── ... (más componentes)
│   │
│   ├── header.tsx                # Encabezado de navegación
│   ├── hero-section.tsx          # Sección hero principal
│   ├── movie-card.tsx            # Tarjeta de película
│   ├── seat-selector.tsx         # Selector de asientos
│   ├── ticket-modal.tsx          # Modal de tiquete
│   └── theme-provider.tsx        # Proveedor de temas
│
├── lib/                          # Utilidades y configuración
│   ├── data.ts                   # Interfaces y datos de ejemplo
│   ├── db.ts                     # Configuración de base de datos
│   └── utils.ts                  # Utilidades generales
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
- Sección hero con destacadas
- Navegación a otras secciones

### Funciones (`/funciones`)
- Lista completa de funciones disponibles
- Filtros por fecha, género y sala
- Selección de función para compra

### Detalle de Película (`/pelicula/[id]`)
- Información detallada de cada película
- Sinopsis, duración, clasificación
- Horarios disponibles y compra de tiquetes

### Validar Tiquete (`/validar`)
- Sistema de validación de tiquetes adquiridos
- Verificación de código de tiquete
- Estados: activo, usado, cancelado

### Panel de Administración (`/admin`)
- **Dashboard**: Estadísticas y métricas
- **Gestión de Películas**: CRUD completo
- **Gestión de Funciones**: Crear/modificar funciones
- **Gestión de Salas**: Administrar salas disponibles
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

## 🎨 Interfaces y Modelos de Datos

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

1. **Exploración de Películas**: Navegación intuitiva por el catálogo de películas
2. **Selección de Asientos**: Interfaz visual para elegir asientos en la sala
3. **Compra de Tiquetes**: Proceso completo de compra con generación de códigos
4. **Validación de Tiquetes**: Sistema para verificar tiquetes en la entrada
5. **Panel de Administración**: Dashboard completo para gestión del cine
6. **Sistema de Temas**: Soporte para modo claro y oscuro
7. **Diseño Responsivo**: Adaptable a dispositivos móviles y escritorio
8. **Base de Datos**: Almacenamiento persistente con PostgreSQL (Neon)

---

## 📊 Estadísticas del Proyecto

- **Componentes UI**: Más de 30 componentes de Radix UI
- **Rutas de API**: 9 endpoints diferentes
- **Páginas**: 6 páginas principales
- **Estado**: Tema oscuro por defecto

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
