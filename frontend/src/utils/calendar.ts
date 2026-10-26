/**
 * Utilidades de Interoperabilidad de Calendarios (HU-32)
 * Generador de archivos estándar iCalendar (.ics) y enlaces dinámicos a Google Calendar.
 */

// Formato RFC 5545 para fechas: YYYYMMDDTHHmmssZ
const formatToIcsDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

export const generarEnlaceGoogleCalendar = (reserva: {
  id: number;
  materia?: string | null;
  laboratorio: { nombre: string; ubicacion?: string | null };
  fechaInicio: string;
  fechaFin: string;
}): string => {
  const titulo = `Clase en Laboratorio: ${reserva.materia || 'Práctica Académica'} (${reserva.laboratorio.nombre})`;
  const inicio = formatToIcsDate(reserva.fechaInicio);
  const fin = formatToIcsDate(reserva.fechaFin);
  const detalles = `Reserva oficial confirmada en LabReserve (FCyT - UMSS).\nReserva #${reserva.id}\nLaboratorio: ${reserva.laboratorio.nombre}\nPresenta tu código QR institucional al ingresar.`;
  const ubicacion = `${reserva.laboratorio.nombre} - ${reserva.laboratorio.ubicacion || 'Campus FCyT UMSS'}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    titulo
  )}&dates=${inicio}/${fin}&details=${encodeURIComponent(detalles)}&location=${encodeURIComponent(ubicacion)}`;
};

export const descargarArchivoIcs = (reserva: {
  id: number;
  materia?: string | null;
  laboratorio: { nombre: string; ubicacion?: string | null };
  fechaInicio: string;
  fechaFin: string;
}): void => {
  const titulo = `Laboratorio: ${reserva.materia || 'Práctica'} - ${reserva.laboratorio.nombre}`;
  const inicio = formatToIcsDate(reserva.fechaInicio);
  const fin = formatToIcsDate(reserva.fechaFin);
  const now = formatToIcsDate(new Date().toISOString());
  const ubicacion = `${reserva.laboratorio.nombre} (${reserva.laboratorio.ubicacion || 'FCyT UMSS'})`;
  const descripcion = `Reserva confirmada en LabReserve FCyT UMSS. Reserva #${reserva.id}. Recuerda validar tu pase QR.`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FCyT UMSS//LabReserve v4.0//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:reserva-${reserva.id}-${inicio}@labreserve.fcyt.umss.edu.bo`,
    `DTSTAMP:${now}`,
    `DTSTART:${inicio}`,
    `DTEND:${fin}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${descripcion}`,
    `LOCATION:${ubicacion}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio: Tu clase en laboratorio inicia en 30 minutos',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Reserva_Lab_${reserva.id}_${reserva.laboratorio.nombre.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};