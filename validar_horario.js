function timeToMinutes(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function validarHorario(nuevaHoraInicio, nuevaDuracion, funcionesExistentes, margenLimpieza = 20) {
    const nuevaInicio = timeToMinutes(nuevaHoraInicio);
    const nuevaFin = nuevaInicio + nuevaDuracion + margenLimpieza;
    
    for (const func of funcionesExistentes) {
        const existeInicio = timeToMinutes(func.hora_inicio);
        const existeFin = existeInicio + func.duracion + margenLimpieza;
        
        if (nuevaInicio < existeFin && nuevaFin > existeInicio) {
            return `Error: Conflicto con "${func.nombre_pelicula}" en el horario ${minutesToTime(existeInicio)} - ${minutesToTime(existeFin)}`;
        }
    }
    
    return 'Aprobada';
}

// ============================================
// PRUEBAS
// ============================================

const funcionesEjemplo = [
    { nombre_pelicula: 'Dune', hora_inicio: '14:00', duracion: 166 },
    { nombre_pelicula: 'Oppenheimer', hora_inicio: '17:00', duracion: 180 },
    { nombre_pelicula: 'Barbie', hora_inicio: '20:30', duracion: 114 },
];

console.log('='.repeat(60));
console.log('VALIDACIÓN DE HORARIOS - CINE');
console.log('='.repeat(60));
console.log();
console.log('Funciones existentes:');
funcionesEjemplo.forEach(f => {
    const fin = timeToMinutes(f.hora_inicio) + f.duracion + 20;
    console.log(`  - ${f.nombre_pelicula}: ${f.hora_inicio} - ${minutesToTime(fin)} (duración: ${f.duracion}min + 20min limpieza)`);
});
console.log();
console.log('-'.repeat(60));
console.log();

// Caso 1: Horario libre
const resultado1 = validarHorario('11:00', 120, funcionesEjemplo);
console.log('Caso 1: Nueva función 11:00 (120 min)');
console.log(`Resultado: ${resultado1}`);
console.log();

// Caso 2: Choca con el final de película anterior
const resultado2 = validarHorario('16:30', 120, funcionesEjemplo);
console.log('Caso 2: Nueva función 16:30 (120 min)');
console.log(`Resultado: ${resultado2}`);
console.log();

// Caso 3: Choca con el inicio de película siguiente
const resultado3 = validarHorario('19:00', 120, funcionesEjemplo);
console.log('Caso 3: Nueva función 19:00 (120 min)');
console.log(`Resultado: ${resultado3}`);
console.log();

// Caso 4: Encaja perfectamente (empieza cuando termina la anterior)
const resultado4 = validarHorario('17:26', 120, funcionesEjemplo);
console.log('Caso 4: Nueva función 17:26 (120 min) - Dune termina 17:26');
console.log(`Resultado: ${resultado4}`);
console.log();

// Caso 5: Con margen personalizado (10 min en lugar de 20)
const resultado5 = validarHorario('17:06', 120, funcionesEjemplo, 10);
console.log('Caso 5: Nueva función 17:06 (120 min) con margen 10min');
console.log(`Resultado: ${resultado5}`);
console.log();
console.log('='.repeat(60));
