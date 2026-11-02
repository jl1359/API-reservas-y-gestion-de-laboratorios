/**
 * Franjas horarias operativas y académicas estándar de la UMSS.
 * Saltos regulares de 15 minutos que integran tanto los periodos oficiales de 90 min (06:45, 08:15, 09:45...)
 * como los bloques de 30 y 60 minutos.
 */
export const OPCIONES_HORARIOS_BASE: string[] = [
  '06:45', '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45'
];

export const MINUTOS_MINIMOS_RESERVA = 60;

export const esDiaSabado = (fechaStr?: string): boolean => {
  if (!fechaStr) return false;
  const partes = fechaStr.split('-').map(Number);
  if (partes.length < 3) return false;
  const date = new Date(partes[0], partes[1] - 1, partes[2]);
  return date.getDay() === 6;
};

export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Obtiene las franjas horarias de inicio disponibles según el día.
 * Se asegura de que la hora de inicio permita al menos 1 hora de reserva (Sábado hasta 11:45, Lunes-Viernes hasta 20:45).
 */
export const obtenerOpcionesHoraInicio = (fechaStr?: string, valorActual?: string): string[] => {
  const sabado = esDiaSabado(fechaStr);
  const maxHora = sabado ? '11:45' : '20:45';
  const opciones = OPCIONES_HORARIOS_BASE.filter((t) => t <= maxHora);
  if (valorActual && !opciones.includes(valorActual)) {
    opciones.push(valorActual);
    opciones.sort();
  }
  return opciones;
};

/**
 * Obtiene las franjas horarias de fin disponibles cumpliendo la duración mínima de 1 hora (60 minutos).
 */
export const obtenerOpcionesHoraFin = (
  horaInicio: string,
  fechaStr?: string,
  valorActual?: string
): string[] => {
  const sabado = esDiaSabado(fechaStr);
  const maxHora = sabado ? '12:45' : '21:45';
  const minFinMins = timeToMinutes(horaInicio) + MINUTOS_MINIMOS_RESERVA;
  const opciones = OPCIONES_HORARIOS_BASE.filter(
    (t) => timeToMinutes(t) >= minFinMins && t <= maxHora
  );
  if (valorActual && timeToMinutes(valorActual) >= minFinMins && !opciones.includes(valorActual)) {
    opciones.push(valorActual);
    opciones.sort();
  }
  return opciones;
};

/**
 * Calcula una hora de fin sugerida (+90 minutos, duración estándar de período académico en UMSS).
 * Garantiza que siempre sea al menos 60 minutos posterior a la hora de inicio.
 */
export const calcularHoraFinSugerida = (horaInicio: string, fechaStr?: string): string => {
  const sabado = esDiaSabado(fechaStr);
  const maxHora = sabado ? '12:45' : '21:45';
  const maxMins = timeToMinutes(maxHora);
  const minsSugeridos = Math.min(timeToMinutes(horaInicio) + 90, maxMins);
  const tiempoSugerido = minutesToTime(minsSugeridos);

  if (
    timeToMinutes(tiempoSugerido) - timeToMinutes(horaInicio) >= MINUTOS_MINIMOS_RESERVA &&
    OPCIONES_HORARIOS_BASE.includes(tiempoSugerido)
  ) {
    return tiempoSugerido;
  }
  return maxHora;
};
