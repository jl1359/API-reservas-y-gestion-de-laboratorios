import { useMemo } from 'react';
import type { ReservaReporte } from '../components/reportes/TablaAuditoriaAsistencias';

export interface MetricaCarrera {
  id?: number;
  nombre: string;
  total: number;
  porcentaje: number;
}

export interface MetricaLaboratorio {
  id: number;
  nombre: string;
  total: number;
  porcentaje: number;
}

export interface MetricaDia {
  fecha: string;
  diaSemana: string;
  total: number;
  porcentaje: number;
}

export interface ResumenReporte {
  totalReservas: number;
  asistenciasRegistradas: number;
  inasistenciasRegistradas: number;
  reservasPendientesAsistencia: number;
  carreraMasDemandada?: MetricaCarrera | null;
  laboratorioMasReservado?: MetricaLaboratorio | null;
  diaMasReservado?: MetricaDia | null;
  porCarrera?: MetricaCarrera[];
  porLaboratorio?: MetricaLaboratorio[];
  porDia?: MetricaDia[];
  porEstado?: Record<string, number>;
}

export interface ReporteData {
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  resumen?: ResumenReporte;
  reservas?: ReservaReporte[];
}

export const COLORES_ESTADOS: Record<string, { bg: string; hex: string }> = {
  'Asistió': { bg: 'bg-emerald-500', hex: '#10b981' },
  'Ausente': { bg: 'bg-rose-500', hex: '#f43f5e' },
  'Aprobada': { bg: 'bg-blue-500', hex: '#0284c7' },
  'Cancelada': { bg: 'bg-slate-400', hex: '#94a3b8' },
  'Pendiente': { bg: 'bg-amber-500', hex: '#f59e0b' }
};

export const PALETA_COLORES = [
  '#0284c7',
  '#4f46e5',
  '#059669',
  '#d97706',
  '#e11d48',
  '#8b5cf6',
  '#0d9488',
  '#ea580c',
  '#0891b2',
  '#475569'
];

export function useReporteAsistenciasCalculos(reporte: ReporteData | null) {
  const total = reporte?.resumen?.totalReservas || 0;
  const asistencias = reporte?.resumen?.asistenciasRegistradas || 0;
  const ausencias = reporte?.resumen?.inasistenciasRegistradas || 0;
  const porcentajeAsistencia = total > 0 ? Math.round((asistencias / total) * 100) : 0;
  const carreraTop = reporte?.resumen?.carreraMasDemandada;
  const labTop = reporte?.resumen?.laboratorioMasReservado;
  const diaTop = reporte?.resumen?.diaMasReservado;

  const maxCarreraReservas = Math.max(...(reporte?.resumen?.porCarrera?.map(c => c.total) || [1]), 1);
  const maxLabReservas = Math.max(...(reporte?.resumen?.porLaboratorio?.map(l => l.total) || [1]), 1);
  const maxDiaReservas = Math.max(...(reporte?.resumen?.porDia?.map(d => d.total) || [1]), 1);

  const segmentosPastelCarreras = useMemo(() => {
    const carrList = reporte?.resumen?.porCarrera || [];
    const totalReservas = reporte?.resumen?.totalReservas || 0;
    if (totalReservas === 0 || carrList.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return carrList.map((c, idx) => {
      const frac = c.total / totalReservas;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        id: c.id,
        nombre: c.nombre,
        total: c.total,
        porcentaje: c.porcentaje,
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [reporte]);

  const segmentosPastelEstados = useMemo(() => {
    if (!reporte?.resumen?.porEstado) return [];
    const totalReservas = reporte.resumen.totalReservas;
    if (totalReservas === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return Object.entries(reporte.resumen.porEstado).map(([estado, cantidad]) => {
      const porcentaje = cantidad / totalReservas;
      const longitudGuion = porcentaje * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += porcentaje;

      const confColor = COLORES_ESTADOS[estado] || { hex: '#6366f1', bg: 'bg-indigo-500' };

      return {
        estado,
        cantidad,
        porcentaje: Math.round(porcentaje * 100),
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color: confColor.hex,
        bgColor: confColor.bg
      };
    });
  }, [reporte]);

  const segmentosPastelLabs = useMemo(() => {
    const labs = reporte?.resumen?.porLaboratorio || [];
    const totalReservas = reporte?.resumen?.totalReservas || 0;
    if (totalReservas === 0 || labs.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return labs.map((l, idx) => {
      const frac = l.total / totalReservas;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        id: l.id,
        nombre: l.nombre,
        total: l.total,
        porcentaje: l.porcentaje,
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [reporte]);

  const segmentosPastelDias = useMemo(() => {
    const dias = reporte?.resumen?.porDia || [];
    const totalReservas = reporte?.resumen?.totalReservas || 0;
    if (totalReservas === 0 || dias.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return dias.map((d, idx) => {
      const frac = d.total / totalReservas;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        fecha: d.fecha,
        diaSemana: d.diaSemana,
        total: d.total,
        porcentaje: d.porcentaje,
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [reporte]);

  const distribucionHoraria = useMemo(() => {
    const franjas = [
      { etiqueta: '06:45 - 08:15', hora: 6.75, cantidad: 0 },
      { etiqueta: '08:15 - 09:45', hora: 8.25, cantidad: 0 },
      { etiqueta: '09:45 - 11:15', hora: 9.75, cantidad: 0 },
      { etiqueta: '11:15 - 12:45', hora: 11.25, cantidad: 0 },
      { etiqueta: '12:45 - 14:15', hora: 12.75, cantidad: 0 },
      { etiqueta: '14:15 - 15:45', hora: 14.25, cantidad: 0 },
      { etiqueta: '15:45 - 17:15', hora: 15.75, cantidad: 0 },
      { etiqueta: '17:15 - 18:45', hora: 17.25, cantidad: 0 },
      { etiqueta: '18:45 - 20:15', hora: 18.75, cantidad: 0 },
      { etiqueta: '20:15 - 21:45', hora: 20.25, cantidad: 0 }
    ];

    if (!reporte?.reservas) return { franjas, maximo: 1 };

    let max = 0;
    for (const r of reporte.reservas) {
      try {
        const d = new Date(r.fechaInicio);
        const horaDecimal = d.getHours() + d.getMinutes() / 60;
        
        for (const f of franjas) {
          if (horaDecimal >= f.hora - 0.25 && horaDecimal < f.hora + 1.25) {
            f.cantidad += 1;
            if (f.cantidad > max) max = f.cantidad;
            break;
          }
        }
      } catch {}
    }

    return { franjas, maximo: max > 0 ? max : 1 };
  }, [reporte]);

  return {
    total,
    asistencias,
    ausencias,
    porcentajeAsistencia,
    carreraTop,
    labTop,
    diaTop,
    maxCarreraReservas,
    maxLabReservas,
    maxDiaReservas,
    segmentosPastelCarreras,
    segmentosPastelEstados,
    segmentosPastelLabs,
    segmentosPastelDias,
    distribucionHoraria
  };
}
