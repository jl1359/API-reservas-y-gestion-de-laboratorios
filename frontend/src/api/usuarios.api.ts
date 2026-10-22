import apiClient from './client';
import type { Usuario, AuditoriaEvento } from '../types';

export const usuariosApi = {
  listar: async (params?: { rolId?: number; carreraId?: number; activo?: boolean; busqueda?: string }): Promise<Usuario[]> => {
    const res = await apiClient.get('/api/usuarios', { params });
    return res.data.data || res.data;
  },

  cambiarRol: async (usuarioId: number, rolId: number, motivo?: string): Promise<Usuario> => {
    const res = await apiClient.put(`/api/usuarios/${usuarioId}/rol`, { rolId, motivo });
    return res.data.data;
  },

  cambiarEstado: async (usuarioId: number, activo: boolean): Promise<Usuario> => {
    const res = await apiClient.patch(`/api/usuarios/${usuarioId}/estado`, { activo });
    return res.data.data;
  },

  obtenerMiPerfil: async (): Promise<Usuario> => {
    const res = await apiClient.get('/api/usuarios/perfil');
    return res.data.data;
  },

  actualizarPerfil: async (datos: { nombreCompleto?: string; ci?: string | null; telefono?: string | null }): Promise<Usuario> => {
    const res = await apiClient.put('/api/usuarios/perfil', datos);
    return res.data.data;
  },

  obtenerAuditoriaSesiones: async (limite: number = 100): Promise<AuditoriaEvento[]> => {
    const res = await apiClient.get('/api/usuarios/auditoria/sesiones', { params: { limite } });
    return res.data.data || res.data;
  }
};
