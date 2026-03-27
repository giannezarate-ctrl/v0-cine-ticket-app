# Configuración de Variables de Entorno en Vercel

## Problema
El error `500 (Internal Server Error)` en `/api/funciones` y `e.reduce is not a function` ocurren porque las variables de entorno no están configuradas en Vercel.

## Solución

### 1. Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

```
DATABASE_URL=postgresql://neondb_owner:npg_KWZJ2jx4eplz@ep-late-lab-acde9nwt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=supersecretkey123cineplexapp2024
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 2. Reemplazar Valores de Cloudinary

Reemplaza los valores de Cloudinary con tus credenciales reales:
- `CLOUDINARY_CLOUD_NAME`: Tu cloud name de Cloudinary
- `CLOUDINARY_API_KEY`: Tu API key de Cloudinary
- `CLOUDINARY_API_SECRET`: Tu API secret de Cloudinary

Puedes encontrar estas credenciales en tu dashboard de Cloudinary.

### 3. Redesplegar

Después de configurar las variables de entorno:
1. Ve a la pestaña "Deployments" en Vercel
2. Haz clic en los tres puntos del último deployment
3. Selecciona "Redeploy"

### 4. Verificar

Una vez redesplegado, verifica que:
- La página `/funciones` carga correctamente
- El panel de admin (`/admin`) funciona
- Puedes crear/editar películas con imágenes

## Nota

Las variables de entorno solo están disponibles en el servidor (API routes), no en el cliente. Por eso es importante que estén configuradas en Vercel para que los endpoints funcionen correctamente.
