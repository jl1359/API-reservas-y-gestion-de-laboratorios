import toast from 'react-hot-toast';
import type { ReservaReporte } from '../components/reportes/TablaAuditoriaAsistencias';

export const exportarDatasetPowerBI = (
  reservas: ReservaReporte[] = [],
  modoAuditoria: 'dia' | 'rango',
  fecha: string,
  fechaInicio: string,
  fechaFin: string
) => {
  if (!reservas || reservas.length === 0) {
    toast.error('No hay datos disponibles para exportar en este período');
    return;
  }

  const formatearHora = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const formatearHoraExacta = (isoDate: string | null | undefined) => {
    if (!isoDate) return null;
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoDate;
    }
  };

  const encabezados = [
    'ID_Reserva',
    'Fecha',
    'Hora_Inicio',
    'Hora_Fin',
    'Carrera_Laboratorio',
    'Laboratorio',
    'Ubicacion',
    'Usuario_Titular',
    'Correo_Usuario',
    'Carrera_Usuario',
    'Modalidad',
    'Numero_Computadora',
    'Estado_Reserva',
    'Asistencia_Registrada',
    'Hora_Ingreso_QR'
  ];

  const filas = reservas.map(r => {
    const fechaReserva = r.fechaInicio.slice(0, 10);
    const horaIni = formatearHora(r.fechaInicio);
    const horaFin = formatearHora(r.fechaFin);
    const carreraLab = (r.laboratorio?.carrera?.nombre || 'General / Sin Asignar').replace(/"/g, '""');
    const carreraUser = 'Sin Carrera';
    const modalidad = r.numeroComputadora ? 'Computadora Individual' : 'Laboratorio Completo';
    const numPc = r.numeroComputadora ? `PC-${r.numeroComputadora}` : 'N/A';
    const asistio = r.horaAsistencia ? 'SI' : 'NO';
    const horaCheckin = formatearHoraExacta(r.horaAsistencia) || 'N/A';
    const labNombre = (r.laboratorio?.nombre || '').replace(/"/g, '""');
    const labUbicacion = (r.laboratorio?.ubicacion || '').replace(/"/g, '""');
    const usuarioNombre = (r.usuario?.nombreCompleto || '').replace(/"/g, '""');
    const usuarioCorreo = (r.usuario?.correo || '').replace(/"/g, '""');

    return [
      r.id,
      fechaReserva,
      `"${horaIni}"`,
      `"${horaFin}"`,
      `"${carreraLab}"`,
      `"${labNombre}"`,
      `"${labUbicacion}"`,
      `"${usuarioNombre}"`,
      `"${usuarioCorreo}"`,
      `"${carreraUser}"`,
      `"${modalidad}"`,
      `"${numPc}"`,
      `"${r.estado}"`,
      `"${asistio}"`,
      `"${horaCheckin}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [encabezados.join(','), ...filas].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const nombreArchivo = modoAuditoria === 'rango'
    ? `Reporte_Asistencias_${fechaInicio}_al_${fechaFin}.csv`
    : `Reporte_Asistencias_${fecha}.csv`;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success('Reporte de asistencias exportado exitosamente (CSV)');
};
