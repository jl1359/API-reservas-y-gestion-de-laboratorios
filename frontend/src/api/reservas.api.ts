import apiClient from './client';
import type { Reserva } from '../types';

export const reservasApi = {
  cancelarReservaPropia: async (reservaId: number): Promise<Reserva> => {
    const res = await apiClient.put(`/api/reservas/${reservaId}/cancelar`);
    return res.data.data;
  },

  cancelarReservaFuerzaMayor: async (reservaId: number, motivo: string): Promise<Reserva> => {
    const res = await apiClient.put(`/api/reservas/${reservaId}/cancelar-fuerza-mayor`, { motivo });
    return res.data.data;
  }
};
