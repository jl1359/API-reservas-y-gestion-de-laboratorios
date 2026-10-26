import apiClient from './client';
import type { Notificacion } from '../types';

export interface NotificacionesRespuesta {
  notificaciones: Notificacion[];
  noLeidasCount: number;
}

export const notificacionesApi = {
  obtenerMisNotificaciones: async (): Promise<NotificacionesRespuesta> => {
    const res = await apiClient.get('/api/notificaciones');
    return res.data;
  },

  marcarTodasComoLeidas: async (): Promise<void> => {
    await apiClient.put('/api/notificaciones/marcar-todas');
  },

  marcarComoLeida: async (id: number): Promise<void> => {
    await apiClient.put(`/api/notificaciones/${id}/leida`);
  }
};

export default notificacionesApi;
