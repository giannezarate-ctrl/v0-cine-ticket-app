# Integración de Cloudinary - Cine Ticket App

## Resumen

Se ha integrado Cloudinary para el manejo de imágenes de películas en el panel de administración.

## Archivos Creados

### 1. `lib/cloudinary.ts`
Configuración de Cloudinary con credenciales desde variables de entorno.

### 2. `app/api/upload/route.ts`
Endpoint POST para subir imágenes a Cloudinary:
- Recibe imagen en base64
- Aplica transformaciones automáticas (800x1200, calidad auto, formato auto)
- Retorna URL segura y public_id

## Archivos Modificados

### 3. `app/admin/page.tsx`
Panel de administración actualizado con:
- Estados para manejar imágenes y previews
- Función `toBase64()` para convertir archivos
- Función `uploadImage()` para subir a Cloudinary
- Funciones para manejar cambios de imagen con preview
- Formularios de creación y edición con input de archivo
- Listado de películas con visualización de posters

### 4. `.env`
Variables de entorno de Cloudinary agregadas (necesitas completar con tus credenciales)

## Configuración Requerida

### Variables de Entorno en Vercel

Debes configurar estas variables en Vercel (Settings → Environment Variables):

```
DATABASE_URL=postgresql://neondb_owner:npg_KWZJ2jx4eplz@ep-late-lab-acde9nwt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=supersecretkey123cineplexapp2024
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Obtener Credenciales de Cloudinary

1. Ve a [cloudinary.com](https://cloudinary.com)
2. Inicia sesión o crea una cuenta
3. En tu dashboard, encontrarás:
   - Cloud Name
   - API Key
   - API Secret

## Funcionalidades

### Crear Película con Imagen
1. Ir a Panel Admin → Películas → Nueva Película
2. Llenar datos de la película
3. Seleccionar imagen en el campo "Poster de la película"
4. Ver preview de la imagen antes de guardar
5. Hacer clic en "Guardar Película"
6. La imagen se sube a Cloudinary automáticamente
7. Se guarda la URL de Cloudinary en la base de datos

### Editar Película con Imagen
1. Ir a Panel Admin → Películas → Editar
2. Se muestran datos actuales de la película
3. Se muestra imagen actual si existe
4. Opcionalmente seleccionar nueva imagen
5. Ver preview de la nueva imagen
6. Hacer clic en "Guardar Cambios"
7. Si hay nueva imagen, se sube a Cloudinary
8. Se actualiza la URL en la base de datos

### Visualizar Películas
- El listado de películas muestra los posters
- Las tarjetas incluyen imagen, título, género y duración
- Botones para editar y eliminar

## Solución de Problemas

### Error 500 en `/api/funciones`

**Causa:** Variables de entorno no configuradas en Vercel

**Solución:**
1. Configurar variables de entorno en Vercel
2. Redesplegar la aplicación
3. Verificar que los endpoints funcionan

### Error `e.reduce is not a function`

**Causa:** El frontend recibe un objeto de error en lugar de un array

**Solución:**
- Configurar variables de entorno en Vercel
- Redesplegar la aplicación
- Verificar que `/api/funciones` retorna un array

### Imágenes no se suben

**Causa:** Credenciales de Cloudinary incorrectas o no configuradas

**Solución:**
1. Verificar credenciales en `.env` local
2. Configurar credenciales en Vercel
3. Redesplegar la aplicación
4. Verificar que `/api/upload` funciona

## Transformaciones de Imagen

Las imágenes se transforman automáticamente al subirse:
- **Tamaño:** 800x1200 píxeles
- **Crop:** Relleno (fill)
- **Calidad:** Automática
- **Formato:** Automático (WebP cuando es soportado)

Esto optimiza el rendimiento y reduce el ancho de banda.

## Seguridad

- Solo usuarios autenticados como admin pueden acceder al panel
- Las credenciales de Cloudinary están en variables de entorno (no en código)
- Las imágenes se suben desde el servidor (no desde el cliente)
- No se exponen API secrets en el frontend

## Producción

Para producción en Vercel:
1. Configurar todas las variables de entorno
2. Asegurarse de que DATABASE_URL apunte a la base de datos de producción
3. Configurar credenciales de Cloudinary de producción
4. Redesplegar la aplicación
