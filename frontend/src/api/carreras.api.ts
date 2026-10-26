import apiClient from './client';
import type { Carrera } from '../types';

export const carrerasApi = {
  listar: async (): Promise<Carrera[]> => {
    const res = await apiClient.get('/api/carreras');
    return res.data || [];
  }
};

export default carrerasApi;
