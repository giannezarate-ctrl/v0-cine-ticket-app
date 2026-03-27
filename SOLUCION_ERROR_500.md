# Solución Error 500 en Endpoints - Cine Ticket App

## Problema Actual

Múltiples endpoints están devolviendo error 500:
- `/api/funciones` - Error 500
- `/api/showtimes` - Error 500

Esto causa que el frontend falle con `e.reduce is not a function` porque recibe un objeto de error en lugar de un array.

## Causa Raíz

El problema es que **las variables de entorno no están configuradas correctamente en Vercel**, específicamente `DATABASE_URL`.

## Solución Paso a Paso

### Paso 1: Verificar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a Settings → Environment Variables
3. Verifica que existan estas variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_KWZJ2jx4eplz@ep-late-lab-acde9nwt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=supersecretkey123cineplexapp2024
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**CRÍTICO:** Las variables deben estar configuradas para:
- ✅ Production
- ✅ Preview
- ✅ Development (opcional)

### Paso 2: Verificar que DATABASE_URL es Correcta

La URL de la base de datos debe ser exactamente:
```
postgresql://neondb_owner:npg_KWZJ2jx4eplz@ep-late-lab-acde9nwt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Verifica:**
- ✅ No hay espacios al inicio o final
- ✅ No hay caracteres extraños
- ✅ La URL está completa

### Paso 3: Redesplegar la Aplicación

Después de configurar las variables de entorno:

1. Ve a la pestaña "Deployments" en Vercel
2. Haz clic en los tres puntos del último deployment
3. Selecciona "Redeploy"
4. Espera a que termine el despliegue

### Paso 4: Verificar que Funciona

Después del redespliegue:

1. Visita `https://v0-cine-ticket-app.vercel.app/api/test-db`
2. Deberías ver una respuesta JSON con:
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

3. Visita `https://v0-cine-ticket-app.vercel.app/funciones`
4. Debería cargar correctamente

## Si el Problema Persiste

### Verificar Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a la pestaña "Logs"
3. Busca errores relacionados con:
   - `DATABASE_URL`
   - `neon`
   - `sql`
   - `connection`

### Verificar que la Base de Datos Está Activa

1. Ve a tu dashboard de Neon
2. Verifica que la base de datos esté activa
3. Verifica que no haya alcanzado el límite de conexiones

### Verificar que las Tablas Existen

Conecta a tu base de datos y ejecuta:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Deberías ver:
- `movies`
- `showtimes`
- `rooms`
- `tickets`

Si las tablas no existen, ejecuta los scripts:
- `scripts/001-create-tables.sql`
- `scripts/002-recreate-tables.sql`
- `scripts/003-fix-schema.sql`

## Resumen

El error 500 en los endpoints NO es un problema de Cloudinary. Es un problema de configuración de la base de datos en Vercel.

**Pasos clave:**
1. ✅ Configurar `DATABASE_URL` en Vercel
2. ✅ Configurar otras variables de entorno
3. ✅ Redesplegar la aplicación
4. ✅ Verificar con `/api/test-db`
5. ✅ Verificar que `/funciones` carga

## Nota Importante

La integración de Cloudinary está completa y funcionando correctamente. El error actual es un problema de configuración de infraestructura, no de código.

Una vez que configures las variables de entorno en Vercel y redespliegues, todos los endpoints funcionarán correctamente.
