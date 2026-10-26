import apiClient from './client';
import type { Rol, SolicitudRol } from '../types';

export const rolesApi = {
  listar: async (paraAdmin?: boolean): Promise<Rol[]> => {
    const res = await apiClient.get('/api/roles', {
      params: paraAdmin ? { paraAdmin: true } : undefined
    });
    return res.data || [];
  },

  listarSolicitudes: async (): Promise<SolicitudRol[]> => {
    const res = await apiClient.get('/api/roles/requests');
    return res.data || [];
  },

  solicitarRol: async (datos: { motivo: string; rolSolicitado: string }): Promise<any> => {
    const res = await apiClient.post('/api/roles/request', datos);
    return res.data;
  },

  gestionarSolicitud: async (
    id: number,
    accion: 'Aprobar' | 'Rechazar',
    motivoRechazo?: string
  ): Promise<any> => {
    const res = await apiClient.put(`/api/roles/manage/${id}`, { accion, motivoRechazo });
    return res.data;
  }
};

export default rolesApi;
