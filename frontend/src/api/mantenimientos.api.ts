import apiClient from './client';
import type { Mantenimiento, Laboratorio } from '../types';

export const mantenimientosApi = {
  listar: async (laboratorioId?: number): Promise<Mantenimiento[]> => {
    const res = await apiClient.get('/api/mantenimientos', {
      params: laboratorioId ? { laboratorioId } : undefined
    });
    return res.data.data || res.data || [];
  },

  crear: async (datos: {
    laboratorioId: number;
    fechaInicio: string;
    fechaFin: string;
    motivo: string;
  }): Promise<Mantenimiento> => {
    const res = await apiClient.post('/api/mantenimientos', datos);
    return res.data.data || res.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/mantenimientos/${id}`);
  },

  cambiarEstadoOperativo: async (
    laboratorioId: number,
    estadoOperativo: 'Activo' | 'Mantenimiento' | 'Inactivo'
  ): Promise<Laboratorio> => {
    const res = await apiClient.patch(
      `/api/mantenimientos/laboratorios/${laboratorioId}/estado-operativo`,
      { estadoOperativo }
    );
    return res.data.data || res.data;
  }
};

export default mantenimientosApi;