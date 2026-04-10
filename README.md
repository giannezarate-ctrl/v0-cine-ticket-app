# 🎬 CinePlex - Sistema de Gestión de Cine y Venta de Tickets

## Descripción del Proyecto

**CinePlex** es una aplicación web completa para la gestión de cartelera de cine y venta de tickets, construida con tecnologías modernas. Permite a los usuarios explorar películas en cartelera, seleccionar funciones, elegir asientos y comprar tickets. Incluye panel de administración y validación de tickets.

---

## 🚀 Características Principales

- **Exploración de Películas** - Catálogo con pósteres, sinopsis y horarios
- **Selección de Asientos** - Interfaz visual interactiva para elegir asientos
- **Compra de Tickets** - Proceso completo con generación de códigos únicos
- **Validación de Tickets** - Sistema con escáner QR y código manual
- **Panel de Administración** - Dashboard completo con estadísticas
- **Gestión de Películas** - CRUD completo desde el admin
- **Gestión de Funciones** - Crear/modificar horarios de funciones
- **Notificaciones Toast** - Mensajes emergentes en toda la app
- **Envío de Correos** - Comprobantes de compra via Brevo
- **Tema Oscuro** - Diseño oscuro por defecto

---

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 16.2.0, React 19.2.4, TypeScript 5.7.3 |
| UI | Tailwind CSS 4.2.0, Radix UI, Lucide React |
| Base de Datos | Neon (PostgreSQL Serverless) |
| Email | Brevo API |
| QR | qrcode, html5-qrcode |
| Gráficos | Recharts |
| Auth | JWT con cookies |

---

## 📁 Estructura del Proyecto

```
v0-cine-ticket-app/
├── app/
│   ├── api/
│   │   ├── auth/          # Autenticación
│   │   ├── email/         # Envío de correos
│   │   ├── movies/        # Películas
│   │   ├── rooms/         # Salas
│   │   ├── setup/         # Inicialización BD
│   │   ├── showtimes/     # Funciones
│   │   ├── stats/        # Estadísticas
│   │   └── tickets/      # Tickets
│   ├── admin/            # Panel de administración
│   ├── funciones/       # Lista de funciones
│   ├── login/            # Login de usuarios
│   ├── mis-tickets/      # Tickets del usuario
│   ├── pelicula/[id]/    # Detalle de película
│   ├── validar/          # Validación de tickets
│   └── page.tsx          # Home / Cartelera
├── components/
│   ├── ui/               # Componentes Radix UI
│   ├── header.tsx        # Navegación
│   ├── seat-selector.tsx # Selector de asientos
│   └── ticket-modal.tsx  # Modal de ticket
└── lib/
    ├── db.ts             # Conexión BD
    ├── email.ts          # Integración Brevo
    └── auth.ts           # Utilidades auth
```

---

## 🔌 API Endpoints

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/auth` | POST | Login, register, logout, me |
| `/api/movies` | GET, POST | Listar/Crear películas |
| `/api/movies/[id]` | GET, PUT, DELETE | Película específica |
| `/api/showtimes` | GET, POST | Listar/Crear funciones |
| `/api/showtimes/[id]/seats` | GET | Asientos de función |
| `/api/tickets` | GET, POST | Listar/Crear tickets |
| `/api/tickets/validate` | POST | Validar ticket |
| `/api/tickets/user` | GET | Tickets del usuario |
| `/api/rooms` | GET | Listar salas |
| `/api/stats` | GET | Estadísticas del cine |
| `/api/email` | POST | Enviar correos |
| `/api/upload` | POST | Subir imágenes (Cloudinary) |

---

## 📄 Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Cartelera - Películas en exhibición |
| `/funciones` | Lista de funciones disponibles |
| `/pelicula/[id]` | Detalle de película + compra |
| `/login` | Login / Registro de usuarios |
| `/mis-tickets` | Tickets comprados por el usuario |
| `/validar` | Validación de tickets (QR + código) |
| `/admin` | Panel de administración |
| `/admin/login` | Login de administrador |

---

## 🗄️ Base de Datos

### Tablas Principales

- **movies** - Catálogo de películas
- **users** - Usuarios (admin/client)
- **rooms** - Salas del cine
- **seats** - Asientos por sala
- **showtimes** - Funciones de películas
- **showtime_seats** - Estado de asientos por función
- **tickets** - Tickets comprados
- **ticket_seats** - Relación ticket-asientos

---

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=supersecretkey123...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Brevo (Email)
BREVO_APIKEY=...
BREVO_SENDER_NAME=...
BREVO_NAME=...
```

---

## 🚀 Cómo Ejecutar

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

---

## 🎯 Funcionalidades del Admin

1. **Dashboard** - Estadísticas (películas, tickets hoy, ingresos, funciones)
2. **Películas** - Crear, editar, eliminar películas
3. **Funciones** - Crear funciones con protección (no eliminar en curso)
4. **Tickets** - Ver todos los tickets con filtro por película
5. **Salas** - Ver estado de las salas

---

## 📊 Características Técnicas

- Autenticación JWT con cookies HttpOnly
- Estados de tickets: active, used, cancelled
- Estados de asientos: available, reserved, sold
- Protección de funciones en curso
- Historial de asientos por función (no se sobrescriben)
- Envío de comprobantes por email

---

## 📝 Notas

- Las funciones pasadas no se muestran al cliente pero sí en admin
- Cada función tiene sus propios asientos independientes
- No se puede eliminar función con tickets activos
- Validación permite código manual o escáner QR