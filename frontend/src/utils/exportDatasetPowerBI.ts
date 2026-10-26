import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import type { ReservaReporte } from '../components/reportes/TablaAuditoriaAsistencias';

const procesarFilasReporte = (reservas: ReservaReporte[]) => {
  const formatearHora = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const formatearHoraExacta = (isoDate: string | null | undefined) => {
    if (!isoDate) return 'N/A';
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoDate;
    }
  };

  return reservas.map(r => ({
    'ID Reserva': r.id,
    'Fecha': r.fechaInicio.slice(0, 10),
    'Hora Inicio': formatearHora(r.fechaInicio),
    'Hora Fin': formatearHora(r.fechaFin),
    'Carrera': r.laboratorio?.carrera?.nombre || 'General / Multidisciplinario',
    'Laboratorio': r.laboratorio?.nombre || '',
    'Ubicación': r.laboratorio?.ubicacion || 'Campus Central',
    'Usuario Titular': r.usuario?.nombreCompleto || '',
    'Correo Institucional': r.usuario?.correo || '',
    'Cédula de Identidad': r.usuario?.ci || 'N/A',
    'Modalidad': r.numeroComputadora ? 'Computadora Individual' : 'Laboratorio Completo',
    'Estación PC': r.numeroComputadora ? `PC-${r.numeroComputadora}` : 'Aforo General',
    'Estado Reserva': r.estado,
    'Asistencia Confirmada': r.horaAsistencia ? 'SÍ' : 'NO',
    'Hora Ingreso QR': formatearHoraExacta(r.horaAsistencia)
  }));
};

export const exportarReporteExcel = (
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

  const filas = procesarFilasReporte(reservas);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filas);

  const colWidths = Object.keys(filas[0] || {}).map(k => ({ wch: Math.max(k.length + 2, 14) }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Auditoría de Asistencias');

  const nombreArchivo = modoAuditoria === 'rango'
    ? `Reporte_Asistencias_${fechaInicio}_al_${fechaFin}.xlsx`
    : `Reporte_Asistencias_${fecha}.xlsx`;

  XLSX.writeFile(wb, nombreArchivo);
  toast.success('Reporte de asistencias exportado exitosamente (.xlsx)');
};

export const exportarReporteCsv = (
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

  const filas = procesarFilasReporte(reservas);
  const ws = XLSX.utils.json_to_sheet(filas);
  const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(ws);

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

  toast.success('Reporte de asistencias exportado exitosamente (.csv)');
};

export const exportarDatasetPowerBI = exportarReporteCsv;