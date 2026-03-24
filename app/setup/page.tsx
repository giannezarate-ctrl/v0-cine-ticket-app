'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración de Base de Datos</CardTitle>
          <CardDescription>
            Inicializa la base de datos creando todas las tablas necesarias, datos de ejemplo y usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Este proceso crea todas las tablas (usuarios, películas, salas, funciones, tickets),
              inserta datos de ejemplo y crea usuarios de prueba. Solo necesitas ejecutarlo una vez.
            </p>
          </div>

          <Button 
            onClick={runSetup} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Ejecutando...' : 'Inicializar Base de Datos'}
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

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Datos de ejemplo:</strong></p>
            <ul className="list-disc list-inside">
              <li>6 películas</li>
              <li>3 salas</li>
              <li>Funciones para los próximos 7 días</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
