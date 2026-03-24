'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [moviesResult, setMoviesResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const runSetup = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      })
    } finally {
      setLoading(false)
    }
  }

  const addMovies = async () => {
    setLoadingMovies(true)
    setMoviesResult(null)
    
    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' })
      })
      const data = await response.json()
      setMoviesResult(data)
    } catch (error) {
      setMoviesResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      })
    } finally {
      setLoadingMovies(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración de Base de Datos</CardTitle>
          <CardDescription>
            Inicializa la base de datos creando las tablas y usuarios necesarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Este proceso crea la tabla de usuarios y 
              usuarios de prueba (admin y test). Solo necesitas ejecutarlo una vez.
            </p>
          </div>

          <Button 
            onClick={runSetup} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Setup'}
          </Button>

          {result && (
            <div className={`p-4 rounded-md ${
              result.success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="font-medium">
                {result.success ? '✓ Éxito' : '✗ Error'}
              </p>
              <p className="text-sm mt-1">
                {result.message || result.error}
              </p>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Credenciales creadas:</strong></p>
            <ul className="list-disc list-inside">
              <li>Admin: admin@gmail.com / admin123</li>
              <li>Test: test@test.com / test123</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Movies Section */}
      <Card className="w-full max-w-md mt-4">
        <CardHeader>
          <CardTitle>Películas de Prueba</CardTitle>
          <CardDescription>
            Agrega películas de ejemplo a la cartelera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Este proceso agrega 5 películas de ejemplo a la cartelera.
              Solo necesitas ejecutarlo una vez.
            </p>
          </div>

          <Button 
            onClick={addMovies} 
            disabled={loadingMovies}
            className="w-full"
          >
            {loadingMovies ? 'Agregando...' : 'Agregar Películas'}
          </Button>

          {moviesResult && (
            <div className={`p-4 rounded-md ${
              moviesResult.success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="font-medium">
                {moviesResult.success ? '✓ Éxito' : '✗ Error'}
              </p>
              <p className="text-sm mt-1">
                {moviesResult.message || moviesResult.error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
