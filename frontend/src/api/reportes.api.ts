import { apiClient } from './client';
import type { ResumenMetricasAcademicas } from '../types';
import * as XLSX from 'xlsx';

export const reportesApi = {
  obtenerMetricas: async (fechaInicio?: string, fechaFin?: string, laboratorioId?: number): Promise<ResumenMetricasAcademicas> => {
    const params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    if (laboratorioId) params.laboratorioId = laboratorioId;

    const res = await apiClient.get<{ success: boolean; data: ResumenMetricasAcademicas }>('/api/reportes/metricas', { params });
    return res.data.data;
  },

  descargarCsv: async (fechaInicio?: string, fechaFin?: string, laboratorioId?: number): Promise<void> => {
    const params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    if (laboratorioId) params.laboratorioId = laboratorioId;

    const res = await apiClient.get('/api/reportes/exportar-csv', {
      params,
      responseType: 'blob'
    });

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fechaActual = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Metricas_Ocupacion_Campus_${fechaActual}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  descargarExcel: async (fechaInicio?: string, fechaFin?: string, laboratorioId?: number): Promise<void> => {
    const metricas = await reportesApi.obtenerMetricas(fechaInicio, fechaFin, laboratorioId);
    const fechaActual = new Date().toISOString().slice(0, 10);

    const filas = (metricas.laboratorios || []).map((lab) => ({
      'Laboratorio': lab.nombre,
      'Carrera': lab.carreraNombre || 'General / Multidisciplinario',
      'Ubicación': lab.ubicacion || 'Campus Central',
      'Capacidad (Asientos)': lab.capacidad,
      'Total Reservas': lab.totalReservas,
      'Horas de Uso Efectivo': lab.horasUsoEfectivo,
      'Asistidas': lab.reservasAsistidas,
      'Ausentes': lab.reservasAusentes,
      'Porcentaje de Asistencia (%)': `${lab.tasaAsistencia}%`,
      'Estudiantes Asistentes': lab.alumnosBeneficiados,
    }));

    const resumen = [
      { 'Métrica General': 'Total Reservas en Campus', 'Valor': metricas.totalReservasCampus },
      { 'Métrica General': 'Total Horas de Uso en Campus', 'Valor': metricas.totalHorasCampus },
      { 'Métrica General': 'Porcentaje de Asistencia Promedio', 'Valor': `${metricas.tasaAsistenciaPromedio}%` },
      { 'Métrica General': 'Total Estudiantes Asistentes', 'Valor': metricas.totalAlumnosBeneficiados },
      { 'Métrica General': 'Laboratorio Más Solicitado', 'Valor': metricas.laboratorioMasDemandado },
    ];

    const wb = XLSX.utils.book_new();
    const wsDetalle = XLSX.utils.json_to_sheet(filas);
    const wsResumen = XLSX.utils.json_to_sheet(resumen);

    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Métricas por Laboratorio');
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Campus');

    XLSX.writeFile(wb, `Informe_Academico_Ocupacion_${fechaActual}.xlsx`);
  },

  descargarCsvMetricas: async (fechaInicio?: string, fechaFin?: string, laboratorioId?: number): Promise<void> => {
    return reportesApi.descargarCsv(fechaInicio, fechaFin, laboratorioId);
  },

  descargarExcelMetricas: async (fechaInicio?: string, fechaFin?: string, laboratorioId?: number): Promise<void> => {
    return reportesApi.descargarExcel(fechaInicio, fechaFin, laboratorioId);
  }
};