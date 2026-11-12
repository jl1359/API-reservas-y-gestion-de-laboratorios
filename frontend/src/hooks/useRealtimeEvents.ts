import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../api/client';

export interface RealtimeEventData {
  tipo: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface UseRealtimeOptions {
  habilitado?: boolean;
  onEvento?: (evento: string, payload: Record<string, unknown>) => void;
}

export const useRealtimeEvents = (options: UseRealtimeOptions = {}) => {
  const { habilitado = true, onEvento } = options;
  const [conectado, setConectado] = useState(false);
  const [ultimoEvento, setUltimoEvento] = useState<RealtimeEventData | null>(null);
  const onEventoRef = useRef(onEvento);
  onEventoRef.current = onEvento;

  useEffect(() => {
    if (!habilitado) {
      setConectado(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setConectado(false);
      return;
    }

    let source: EventSource | null = null;
    let timerReconexion: NodeJS.Timeout | null = null;
    let cancelado = false;

    const conectar = () => {
      if (cancelado) return;
      const url = `${API_BASE_URL}/api/realtime/stream?token=${encodeURIComponent(token)}`;
      source = new EventSource(url);

      source.onopen = () => {
        setConectado(true);
      };

      source.onerror = () => {
        setConectado(false);
        source?.close();
        if (!cancelado) {
          timerReconexion = setTimeout(conectar, 5000);
        }
      };

      const procesarEvento = (nombreEvento: string, e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const eventoInfo: RealtimeEventData = {
            tipo: nombreEvento,
            data: parsed,
            timestamp: parsed.timestamp || new Date().toISOString(),
          };
          setUltimoEvento(eventoInfo);
          onEventoRef.current?.(nombreEvento, parsed);
        } catch {
          // Ignorar marcos no JSON
        }
      };

      const eventosSoportados = [
        'reserva_creada',
        'reserva_actualizada',
        'asistencia_registrada',
        'laboratorio_actualizado',
        'sancion_actualizada',
      ];

      for (const ev of eventosSoportados) {
        source.addEventListener(ev, (e) => procesarEvento(ev, e as MessageEvent));
      }
    };

    conectar();

    return () => {
      cancelado = true;
      if (timerReconexion) clearTimeout(timerReconexion);
      source?.close();
      setConectado(false);
    };
  }, [habilitado]);

  return { conectado, ultimoEvento };
};
