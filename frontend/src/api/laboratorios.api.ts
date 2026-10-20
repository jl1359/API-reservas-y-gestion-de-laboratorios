import apiClient from './client';
import type { Laboratorio, Mantenimiento } from '../types';

export const laboratoriosApi = {
  cambiarEstadoOperativo: async (
    laboratorioId: number,
    estadoOperativo: 'Activo' | 'Mantenimiento' | 'Inactivo'
  ): Promise<Laboratorio> => {
    const res = await apiClient.patch(
      `/api/mantenimientos/laboratorios/${laboratorioId}/estado-operativo`,
      { estadoOperativo }
    );
    return res.data.data;
  },

  registrarMantenimiento: async (datos: {
    laboratorioId: number;
    fechaInicio: string;
    fechaFin: string;
    motivo: string;
  }): Promise<Mantenimiento> => {
    const res = await apiClient.post('/api/mantenimientos', datos);
    return res.data.data;
  },

  listarMantenimientos: async (laboratorioId?: number): Promise<Mantenimiento[]> => {
    const res = await apiClient.get('/api/mantenimientos', {
      params: { laboratorioId }
    });
    return res.data.data || res.data;
  },

  eliminarMantenimiento: async (mantenimientoId: number): Promise<void> => {
    await apiClient.delete(`/api/mantenimientos/${mantenimientoId}`);
  }
};
