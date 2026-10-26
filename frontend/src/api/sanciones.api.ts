import { apiClient } from './client';
import type { Sancion } from '../types';

export const sancionesApi = {
  listarTodas: async (estado?: string): Promise<Sancion[]> => {
    const params = estado && estado !== 'Todas' ? { estado } : {};
    const res = await apiClient.get<{ success: boolean; data: Sancion[] }>('/api/sanciones', { params });
    return res.data.data;
  },

  perdonarSancion: async (id: number, motivoPerdon?: string) => {
    const res = await apiClient.put(`/api/sanciones/${id}/perdonar`, { motivoPerdon });
    return res.data;
  },

  crearSancionManual: async (payload: { usuarioId: number; horasDuracion: number; motivo: string }) => {
    const res = await apiClient.post('/api/sanciones/manual', payload);
    return res.data;
  },

  procesarInasistencias: async (toleranciaMinutos = 15) => {
    const res = await apiClient.post('/api/sanciones/procesar-inasistencias', { toleranciaMinutos });
    return res.data;
  }
};