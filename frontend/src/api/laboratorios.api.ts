import apiClient from './client';
import type { Laboratorio, Mantenimiento } from '../types';

export const laboratoriosApi = {
  listar: async (params?: {
    incluirTodos?: boolean;
    capacidadRequerida?: number;
    categoriaTexto?: string;
    reservaPorAsiento?: boolean;
    tieneProyector?: boolean;
  }): Promise<Laboratorio[]> => {
    const res = await apiClient.get('/api/laboratorios', { params });
    return res.data?.laboratorios || res.data?.data || res.data || [];
  },

  obtenerPorId: async (id: number): Promise<Laboratorio> => {
    const res = await apiClient.get(`/api/laboratorios/${id}`);
    return res.data?.data || res.data;
  },

  obtenerCalendario: async (id: number): Promise<any> => {
    const res = await apiClient.get(`/api/laboratorios/${id}/calendario`);
    return res.data?.data || res.data;
  },

  crear: async (datos: any): Promise<Laboratorio> => {
    const res = await apiClient.post('/api/laboratorios', datos);
    return res.data?.data || res.data;
  },

  actualizar: async (id: number, datos: any): Promise<Laboratorio> => {
    const res = await apiClient.put(`/api/laboratorios/${id}`, datos);
    return res.data?.data || res.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/laboratorios/${id}`);
  },

  // Métodos de compatibilidad histórica (también disponibles en mantenimientosApi)
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

export default laboratoriosApi;
