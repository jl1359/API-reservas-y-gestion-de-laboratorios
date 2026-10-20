import { apiClient } from './client';
import type { ResumenMetricasAcademicas } from '../types';

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
    link.setAttribute('download', `Informe_Academico_Ocupacion_${fechaActual}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
