#!/usr/bin/env node
/**
 * Sistema de Validación de Funciones - Cine
 * Valida que las funciones no se solapen considerando duración y margen de limpieza.
 */

function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function validarFuncion(salaId, horaInicio, duracion, funcionesExistentes) {
    // 1. Validar horario de operación
    const HORA_APERTURA = timeToMinutes('10:00');
    const HORA_CIERRE = timeToMinutes('23:00');
    const MARGEN_LIMPIEZA = 15;
    
    const inicioNuevo = timeToMinutes(horaInicio);
    const finNuevo = inicioNuevo + duracion + MARGEN_LIMPIEZA;
    
    // Verificar apertura
    if (inicioNuevo < HORA_APERTURA) {
        return `❌ ERROR: Fuera de horario. El cine abre a las 10:00. Intentaste programar a las ${horaInicio}.`;
    }
    
    // Verificar cierre
    if (finNuevo > HORA_CIERRE) {
        const horaFinReal = minutesToTime(inicioNuevo + duracion);
        return `❌ ERROR: Fuera de horario. La función terminaría a las ${horaFinReal} (limpieza hasta ${minutesToTime(finNuevo)}), pero el cine cierra a las 23:00.`;
    }
    
    // 2. Filtrar solo funciones de la misma sala
    const funcionesMismaSala = funcionesExistentes.filter(f => f.sala_id === salaId);
    
    // 3. Verificar solapamientos
    for (const func of funcionesMismaSala) {
        const inicioExistente = timeToMinutes(func.hora_inicio);
        const duracionExistente = func.duracion;
        const finExistente = inicioExistente + duracionExistente + MARGEN_LIMPIEZA;
        
        // ¿Se solapan?
        if (inicioNuevo < finExistente && finNuevo > inicioExistente) {
            const horaFinExistente = minutesToTime(inicioExistente + duracionExistente);
            return `❌ ERROR: Solapamiento en ${salaId}. ` +
                   `Ya hay una función de ${func.hora_inicio} a ${horaFinExistente} ` +
                   `(limp. hasta ${minutesToTime(finExistente)}). ` +
                   `Tu función (${horaInicio} - ${minutesToTime(inicioNuevo + duracion)}) ` +
                   `choca con este horario.`;
        }
    }
    
    // 4. Todo OK
    const horaFin = minutesToTime(inicioNuevo + duracion);
    const horaLimpieza = minutesToTime(finNuevo);
    console.log(`✅ APROBADO: Función en ${salaId} de ${horaInicio} a ${horaFin} (limpieza hasta ${horaLimpieza})`);
    return true;
}

function main() {
    console.log("=".repeat(70));
    console.log("🎬 SISTEMA DE VALIDACIÓN DE FUNCIONES - CINE");
    console.log("=".repeat(70));
    console.log("\nReglas:");
    console.log("  • Horario: 10:00 - 23:00");
    console.log("  • Margen de limpieza: 15 minutos entre funciones");
    console.log("  • Validación por sala (Sala 1 ≠ Sala 2)");
    console.log();
    
    // Funciones existentes en la base de datos
    const funcionesDb = [
        { sala_id: 'Sala 1', hora_inicio: '14:00', duracion: 120 },
        { sala_id: 'Sala 1', hora_inicio: '17:00', duracion: 150 },
        { sala_id: 'Sala 2', hora_inicio: '15:00', duracion: 100 },
    ];
    
    console.log("📋 Funciones existentes:");
    for (const f of funcionesDb) {
        const fin = timeToMinutes(f.hora_inicio) + f.duracion;
        const finLimpieza = fin + 15;
        console.log(`   • ${f.sala_id}: ${f.hora_inicio} - ${minutesToTime(fin)} (limp. ${minutesToTime(finLimpieza)})`);
    }
    console.log();
    console.log("=".repeat(70));
    
    // CASO 1: Antes de la apertura
    console.log("\n🧪 CASO 1: Programar a las 09:00 (antes de apertura)");
    let resultado = validarFuncion('Sala 1', '09:00', 120, funcionesDb);
    console.log(resultado);
    console.log();
    
    // CASO 2: Solapamiento - Película larga choca con siguiente
    console.log("🧪 CASO 2: Programar 3h a las 13:00 en Sala 1 (choca con función a las 15:00)");
    console.log("   Nueva función: 13:00 - 16:00 (limp. 16:15)");
    console.log("   Existente: 14:00 - 16:00 (limp. 16:15) ← Solapamiento!");
    resultado = validarFuncion('Sala 1', '13:00', 180, funcionesDb);
    console.log(resultado);
    console.log();
    
    // CASO 3: Misma hora, sala diferente
    console.log("🧪 CASO 3: Programar a las 13:00 en Sala 2 (Sala 1 está ocupada)");
    resultado = validarFuncion('Sala 2', '13:00', 120, funcionesDb);
    console.log();
    
    // CASO 4: Entre funciones (hueco insuficiente)
    console.log("🧪 CASO 4: Programar a las 16:15 en Sala 1 (limpieza termina a 16:15)");
    console.log("   Función anterior termina a las 16:15 incluyendo limpieza");
    resultado = validarFuncion('Sala 1', '16:15', 30, funcionesDb);
    if (resultado === true) {
        console.log("✅ APROBADO: Hueco justo después de la limpieza");
    }
    console.log();
    
    // CASO 5: Después del cierre
    console.log("🧪 CASO 5: Programar a las 22:00 con duración de 2 horas");
    resultado = validarFuncion('Sala 1', '22:00', 120, funcionesDb);
    console.log(resultado);
    console.log();
    
    console.log("=".repeat(70));
    console.log("📊 Resumen: El sistema protege contra:");
    console.log("   ✓ Horarios fuera de operación");
    console.log("   ✓ Solapamientos entre funciones");
    console.log("   ✓ Duraciones que exceden horarios");
    console.log("   ✓ Salas son independientes entre sí");
    console.log("=".repeat(70));
}

main();
