import apiClient from './client';
import type { Reserva } from '../types';

export const reservasApi = {
  listarTodas: async (): Promise<Reserva[]> => {
    const res = await apiClient.get('/api/reservas');
    return res.data?.data || res.data?.reservas || res.data || [];
  },

  listarMisReservas: async (): Promise<Reserva[]> => {
    const res = await apiClient.get('/api/reservas/mis-reservas');
    return res.data?.data || res.data?.reservas || res.data || [];
  },

  listarPendientes: async (): Promise<Reserva[]> => {
    const res = await apiClient.get('/api/reservas/pendientes');
    return res.data?.data || res.data || [];
  },

  crearReservaGrupal: async (datos: {
    laboratorioId: number;
    fechaInicio: string;
    fechaFin: string;
    motivo: string;
    materia?: string;
    cantidadAlumnos?: number;
  }): Promise<Reserva> => {
    const res = await apiClient.post('/api/reservas', datos);
    return res.data?.data || res.data;
  },

  crearReservaIndividual: async (
    laboratorioId: number,
    datos: {
      fecha: string;
      horaInicio: string;
      horaFin: string;
      motivo?: string;
      numeroComputadora?: number;
    }
  ): Promise<Reserva> => {
    const res = await apiClient.post(`/api/laboratorios/${laboratorioId}/reservas`, datos);
    return res.data?.data || res.data;
  },

  aprobarReserva: async (reservaId: number): Promise<Reserva> => {
    const res = await apiClient.put(`/api/reservas/${reservaId}/aprobar`);
    return res.data?.data || res.data;
  },

  rechazarReserva: async (reservaId: number, motivoRechazo?: string): Promise<Reserva> => {
    const res = await apiClient.put(`/api/reservas/${reservaId}/rechazar`, { motivoRechazo });
    return res.data?.data || res.data;
  },

  cancelarReservaPropia: async (reservaId: number, motivo?: string): Promise<Reserva> => {
    const res = await apiClient.put(`/api/reservas/${reservaId}/cancelar`, { motivo });
    return res.data?.data || res.data;
  },

  cancelarReservaFuerzaMayor: async (reservaId: number, motivo: string): Promise<Reserva> => {
    const res = await apiClient.put(`/api/reservas/${reservaId}/cancelar-fuerza-mayor`, { motivo });
    return res.data?.data || res.data;
  },

  obtenerQr: async (reservaId: number): Promise<{ tokenQr: string; qrDataUrl?: string }> => {
    const res = await apiClient.get(`/api/reservas/${reservaId}/qr`);
    return res.data?.data || res.data;
  },

  escanearQr: async (tokenQr: string, codigoManual?: string): Promise<any> => {
    const res = await apiClient.post('/api/reservas/escanear-qr', { tokenQr, codigoManual });
    return res.data;
  },

  listarTurnoActual: async (laboratorioId?: number): Promise<any> => {
    const res = await apiClient.get('/api/reservas/turno-actual', {
      params: laboratorioId ? { laboratorioId } : undefined
    });
    return res.data;
  },

  registrarAsistenciaManual: async (reservaId: number): Promise<any> => {
    const res = await apiClient.post(`/api/reservas/${reservaId}/asistencia-manual`);
    return res.data;
  }
};

export default reservasApi;
