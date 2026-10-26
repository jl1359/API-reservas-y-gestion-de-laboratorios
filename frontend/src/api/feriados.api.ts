import apiClient from './client';
import type { Feriado } from '../types';

export const feriadosApi = {
  listar: async (): Promise<Feriado[]> => {
    const res = await apiClient.get('/api/feriados');
    return res.data.data || res.data || [];
  },

  crear: async (datos: { fecha: string; motivo: string }): Promise<Feriado> => {
    const res = await apiClient.post('/api/feriados', datos);
    return res.data.data || res.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/feriados/${id}`);
  },

  toggleBloqueo: async (id: number): Promise<Feriado> => {
    const res = await apiClient.patch(`/api/feriados/${id}/toggle`);
    return res.data.data || res.data;
  }
};

export default feriadosApi;
