#!/usr/bin/env python3
"""
Sistema de Validación de Funciones - Cine
Valida que las funciones no se solapen considerando duración y margen de limpieza.
"""

def time_to_minutes(time_str):
    """Convierte HH:MM a minutos desde medianoche."""
    h, m = map(int, time_str.split(':'))
    return h * 60 + m

def minutes_to_time(minutes):
    """Convierte minutos a HH:MM."""
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}"

def validar_funcion(sala_id, hora_inicio, duracion, funciones_existentes):
    """
    Valida si una función puede programarse.
    
    Args:
        sala_id: ID de la sala (ej: 'Sala 1')
        hora_inicio: Hora de inicio en formato 'HH:MM'
        duracion: Duración en minutos
        funciones_existentes: Lista de dicts con {sala_id, hora_inicio, duracion}
    
    Returns:
        True si es válido, o string con mensaje de error
    """
    
    # 1. Validar horario de operación
    HORA_APERTURA = time_to_minutes('10:00')
    HORA_CIERRE = time_to_minutes('23:00')
    MARGEN_LIMPIEZA = 15
    
    inicio_nuevo = time_to_minutes(hora_inicio)
    fin_nuevo = inicio_nuevo + duracion + MARGEN_LIMPIEZA
    
    # Verificar apertura
    if inicio_nuevo < HORA_APERTURA:
        return f"❌ ERROR: Fuera de horario. El cine abre a las 10:00. Intentaste programar a las {hora_inicio}."
    
    # Verificar cierre
    if fin_nuevo > HORA_CIERRE:
        hora_fin_real = minutes_to_time(inicio_nuevo + duracion)
        return f"❌ ERROR: Fuera de horario. La función terminaría a las {hora_fin_real} (limpieza hasta {minutes_to_time(fin_nuevo)}), pero el cine cierra a las 23:00."
    
    # 2. Filtrar solo funciones de la misma sala
    funciones_misma_sala = [f for f in funciones_existentes if f['sala_id'] == sala_id]
    
    # 3. Verificar solapamientos
    for func in funciones_misma_sala:
        inicio_existente = time_to_minutes(func['hora_inicio'])
        duracion_existente = func['duracion']
        fin_existente = inicio_existente + duracion_existente + MARGEN_LIMPIEZA
        
        # ¿Se solapan?
        # Nueva empieza antes de que termine la existente AND
        # Nueva termina después de que empieza la existente
        if inicio_nuevo < fin_existente and fin_nuevo > inicio_existente:
            hora_fin_existente = minutes_to_time(inicio_existente + duracion_existente)
            return (f"❌ ERROR: Solapamiento en {sala_id}. "
                   f"Ya hay una función de {func['hora_inicio']} a {hora_fin_existente} "
                   f"(limp. hasta {minutes_to_time(fin_existente)}). "
                   f"Tu función ({hora_inicio} - {minutes_to_time(inicio_nuevo + duracion)}) "
                   f"choca con este horario.")
    
    # 4. Todo OK
    hora_fin = minutes_to_time(inicio_nuevo + duracion)
    hora_limpieza = minutes_to_time(fin_nuevo)
    print(f"✅ APROBADO: Función en {sala_id} de {hora_inicio} a {hora_fin} (limpieza hasta {hora_limpieza})")
    return True


def main():
    print("=" * 70)
    print("🎬 SISTEMA DE VALIDACIÓN DE FUNCIONES - CINE")
    print("=" * 70)
    print("\nReglas:")
    print("  • Horario: 10:00 - 23:00")
    print("  • Margen de limpieza: 15 minutos entre funciones")
    print("  • Validación por sala (Sala 1 ≠ Sala 2)")
    print()
    
    # Funciones existentes en la base de datos
    funciones_db = [
        {'sala_id': 'Sala 1', 'hora_inicio': '14:00', 'duracion': 120},  # Termina 16:15
        {'sala_id': 'Sala 1', 'hora_inicio': '17:00', 'duracion': 150},  # Termina 19:45
        {'sala_id': 'Sala 2', 'hora_inicio': '15:00', 'duracion': 100},  # Termina 16:55
    ]
    
    print("📋 Funciones existentes:")
    for f in funciones_db:
        fin = time_to_minutes(f['hora_inicio']) + f['duracion']
        fin_limpieza = fin + 15
        print(f"   • {f['sala_id']}: {f['hora_inicio']} - {minutes_to_time(fin)} (limp. {minutes_to_time(fin_limpieza)})")
    print()
    print("=" * 70)
    
    # CASO 1: Antes de la apertura
    print("\n🧪 CASO 1: Programar a las 09:00 (antes de apertura)")
    resultado = validar_funcion('Sala 1', '09:00', 120, funciones_db)
    print(resultado)
    print()
    
    # CASO 2: Solapamiento - Película larga choca con siguiente
    print("🧪 CASO 2: Programar 3h a las 13:00 en Sala 1 (choca con función a las 15:00)")
    print("   Nueva función: 13:00 - 16:00 (limp. 16:15)")
    print("   Existente: 14:00 - 16:00 (limp. 16:15) ← Solapamiento!")
    resultado = validar_funcion('Sala 1', '13:00', 180, funciones_db)
    print(resultado)
    print()
    
    # CASO 3: Misma hora, sala diferente
    print("🧪 CASO 3: Programar a las 13:00 en Sala 2 (Sala 1 está ocupada)")
    resultado = validar_funcion('Sala 2', '13:00', 120, funciones_db)
    print()
    
    # CASO 4: Entre funciones (hueco insuficiente)
    print("🧪 CASO 4: Programar a las 16:15 en Sala 1 (limpieza termina a 16:15)")
    print("   Función anterior termina a las 16:15 incluyendo limpieza")
    resultado = validar_funcion('Sala 1', '16:15', 30, funciones_db)
    if resultado == True:
        print("✅ APROBADO: Hueco justo después de la limpieza")
    print()
    
    # CASO 5: Después del cierre
    print("🧪 CASO 5: Programar a las 22:00 con duración de 2 horas")
    resultado = validar_funcion('Sala 1', '22:00', 120, funciones_db)
    print(resultado)
    print()
    
    print("=" * 70)
    print("📊 Resumen: El sistema protege contra:")
    print("   ✓ Horarios fuera de operación")
    print("   ✓ Solapamientos entre funciones")
    print("   ✓ Duraciones que exceden horarios")
    print("   ✓ Salas son independientes entre sí")
    print("=" * 70)


if __name__ == '__main__':
    main()
