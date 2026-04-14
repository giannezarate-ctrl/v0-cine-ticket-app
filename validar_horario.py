def time_to_minutes(hora):
    h, m = map(int, hora.split(':'))
    return h * 60 + m

def minutes_to_time(minutos):
    h = minutos // 60
    m = minutos % 60
    return f'{h:02d}:{m:02d}'

def validar_horario(nueva_hora_inicio, nueva_duracion, funciones_existentes, margen_limpieza=20):
    """
    Valida si un nuevo horario se puede programar sin conflictos.
    
    Args:
        nueva_hora_inicio: HH:MM formato
        nueva_duracion: minutos
        funciones_existentes: lista de dicts con nombre_pelicula, hora_inicio, duracion
        margen_limpieza: minutos de margen entre películas (default 20)
    
    Returns:
        'Aprobada' o mensaje de error
    """
    nueva_inicio = time_to_minutes(nueva_hora_inicio)
    nueva_fin = nueva_inicio + nueva_duracion + margen_limpieza
    
    for func in funciones_existentes:
        existe_inicio = time_to_minutes(func['hora_inicio'])
        existe_fin = existe_inicio + func['duracion'] + margen_limpieza
        
        # Verificar si hay solapamiento
        if nueva_inicio < existe_fin and nueva_fin > existe_inicio:
            return f'Error: Conflicto con "{func["nombre_pelicula"]}" en el horario {minutes_to_time(existe_inicio)} - {minutes_to_time(existe_fin)}'
    
    return 'Aprobada'

# ============================================
# PRUEBAS
# ============================================

funciones_ejemplo = [
    {'nombre_pelicula': 'Dune', 'hora_inicio': '14:00', 'duracion': 166},
    {'nombre_pelicula': 'Oppenheimer', 'hora_inicio': '17:00', 'duracion': 180},
    {'nombre_pelicula': 'Barbie', 'hora_inicio': '20:30', 'duracion': 114},
]

print('=' * 60)
print('VALIDACIÓN DE HORARIOS - CINE')
print('=' * 60)
print()
print(f'Funciones existentes:')
for f in funciones_ejemplo:
    fin = time_to_minutes(f['hora_inicio']) + f['duracion'] + 20
    print(f'  - {f["nombre_pelicula"]}: {f["hora_inicio"]} - {minutes_to_time(fin)} (duración: {f["duracion"]}min + 20min limpieza)')
print()
print('-' * 60)
print()

# Caso 1: Horario libre
resultado1 = validar_horario('11:00', 120, funciones_ejemplo)
print(f'Caso 1: Nueva función 11:00 (120 min)')
print(f'Resultado: {resultado1}')
print()

# Caso 2: Choca con el final de película anterior
resultado2 = validar_horario('16:30', 120, funciones_ejemplo)
print(f'Caso 2: Nueva función 16:30 (120 min)')
print(f'Resultado: {resultado2}')
print()

# Caso 3: Choca con el inicio de película siguiente
resultado3 = validar_horario('19:00', 120, funciones_ejemplo)
print(f'Caso 3: Nueva función 19:00 (120 min)')
print(f'Resultado: {resultado3}')
print()

# Caso 4: Encaja perfectamente (empieza cuando termina la anterior)
resultado4 = validar_horario('17:26', 120, funciones_ejemplo)
print(f'Caso 4: Nueva función 17:26 (120 min) - Dune termina 17:26')
print(f'Resultado: {resultado4}')
print()

# Caso 5: Con margen personalizado (10 min en lugar de 20)
resultado5 = validar_horario('17:06', 120, funciones_ejemplo, margen_limpieza=10)
print(f'Caso 5: Nueva función 17:06 (120 min) con margen 10min')
print(f'Resultado: {resultado5}')
print()
print('=' * 60)
