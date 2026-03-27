# Diagnóstico de Errores - Cine Ticket App

## Error Actual

### Síntomas
- Página `/funciones` no carga
- Error: "This page couldn't load. Reload to try again, or go back."
- Error 500 en `/api/funciones`
- Error: `e.reduce is not a function`

### Causa Raíz
El endpoint `/api/funciones` devuelve un error 500, lo que causa que el frontend reciba un objeto de error en lugar de un array. Cuando el frontend intenta usar `.reduce()` en ese objeto, falla.

## Diagnóstico Paso a Paso

### 1. Verificar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y verifica que existan:

```
DATABASE_URL=postgresql://neondb_owner:npg_KWZJ2jx4eplz@ep-late-lab-acde9nwt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=supersecretkey123cineplexapp2024
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**Importante:** Las variables deben estar configuradas para el entorno correcto (Production, Preview, Development).

### 2. Probar Conexión a Base de Datos

Después de desplegar, visita:
```
https://tu-dominio.vercel.app/api/test-db
```

Este endpoint verificará:
- Conexión a la base de datos
- Existencia de tablas
- Cantidad de registros en cada tabla

### 3. Verificar Logs en Vercel

Ve a tu proyecto en Vercel → Logs y busca errores relacionados con:
- `DATABASE_URL`
- `neon`
- `sql`
- `funciones`

### 4. Verificar Tablas en Base de Datos

Conecta a tu base de datos Neon y verifica que existan las tablas:
- `movies`
- `showtimes`
- `rooms`
- `tickets`

### 5. Verificar Datos en Tablas

Verifica que haya datos en las tablas:
```sql
SELECT COUNT(*) FROM movies;
SELECT COUNT(*) FROM showtimes;
SELECT COUNT(*) FROM rooms;
```

## Soluciones

### Solución 1: Variables de Entorno No Configuradas

**Problema:** Variables de entorno no configuradas en Vercel

**Solución:**
1. Ir a Vercel → Settings → Environment Variables
2. Agregar todas las variables requeridas
3. Redesplegar la aplicación

### Solución 2: Tablas No Existen

**Problema:** Las tablas no existen en la base de datos

**Solución:**
1. Conectar a la base de datos Neon
2. Ejecutar los scripts de creación de tablas:
   - `scripts/001-create-tables.sql`
   - `scripts/002-recreate-tables.sql`
   - `scripts/003-fix-schema.sql`

### Solución 3: Sin Datos en Tablas

**Problema:** Las tablas existen pero no tienen datos

**Solución:**
1. Ejecutar script para agregar películas:
   ```bash
   node scripts/add-movies.js
   ```
2. Agregar funciones desde el panel de admin

### Solución 4: Error en Consulta SQL

**Problema:** La consulta SQL tiene un error

**Solución:**
Revisar el endpoint `/api/funciones` y verificar que las columnas existan en las tablas.

## Endpoint de Diagnóstico

He creado un endpoint de diagnóstico en `/api/test-db` que verifica:

1. **Conexión a base de datos:** Verifica que la conexión funcione
2. **Tablas existentes:** Lista todas las tablas públicas
3. **Conteo de registros:** Muestra cuántos registros hay en cada tabla

### Cómo Usar

1. Desplegar la aplicación
2. Visitar `https://tu-dominio.vercel.app/api/test-db`
3. Revisar la respuesta JSON

### Respuesta Esperada (Éxito)

```json
{
  "status": "ok",
  "database": "connected",
  "tables": ["movies", "showtimes", "rooms", "tickets"],
  "counts": {
    "showtimes": 10,
    "movies": 5,
    "rooms": 3
  }
}
```

### Respuesta de Error

```json
{
  "status": "error",
  "error": "connection refused",
  "stack": "..."
}
```

## Pasos para Resolver

1. **Verificar variables de entorno en Vercel**
2. **Visitar `/api/test-db` para diagnosticar**
3. **Revisar logs en Vercel**
4. **Verificar tablas y datos en base de datos**
5. **Redesplegar después de cambios**

## Notas Importantes

- Las variables de entorno solo están disponibles en el servidor (API routes)
- Después de cambiar variables de entorno, debes redesplegar
- El endpoint `/api/test-db` es temporal para diagnóstico
- Eliminar `/api/test-db` después de resolver el problema

## Recursos

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Neon Database](https://neon.tech)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
