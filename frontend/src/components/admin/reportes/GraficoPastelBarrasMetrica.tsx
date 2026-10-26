import { BarChart3, PieChart, Eye } from 'lucide-react';
import type { MetricasLaboratorio } from '../../../types';

export interface SegmentoMetrica {
  id: number;
  nombre: string;
  valor: number;
  porcentaje: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
  lab: MetricasLaboratorio;
}

export interface LabBarraItem {
  laboratorioId: number;
  nombre: string;
  valor: number;
  lab: MetricasLaboratorio;
}

interface GraficoPastelBarrasMetricaProps {
  titulo: string;
  subtitulo: string;
  totalCentro: number | string;
  etiquetaCentro: string;
  unidad: string;
  formato: 'pastel' | 'barras';
  onToggleFormato: (formato: 'pastel' | 'barras') => void;
  segmentos: SegmentoMetrica[];
  laboratorios: LabBarraItem[];
  maxValor: number;
  paletaColores: string[];
  onSelectLab: (lab: MetricasLaboratorio) => void;
}

export default function GraficoPastelBarrasMetrica({
  titulo,
  subtitulo,
  totalCentro,
  etiquetaCentro,
  unidad,
  formato,
  onToggleFormato,
  segmentos,
  laboratorios,
  maxValor,
  paletaColores,
  onSelectLab
}: GraficoPastelBarrasMetricaProps) {
  return (
    <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            {titulo}
          </h5>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {subtitulo}
          </p>
        </div>

        <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleFormato('barras')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              formato === 'barras'
                ? 'bg-tech-blue text-white font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Barras</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleFormato('pastel')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              formato === 'pastel'
                ? 'bg-tech-blue text-white font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Circular</span>
          </button>
        </div>
      </div>

      {formato === 'pastel' ? (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
          <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="14"
                fill="transparent"
              />
              {segmentos.map((seg) => (
                <circle
                  key={seg.id}
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={seg.color}
                  strokeWidth="14"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-500 ease-out hover:opacity-80"
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-poppins font-extrabold text-slate-900 dark:text-white leading-none">
                {totalCentro}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {etiquetaCentro}
              </span>
            </div>
          </div>

          <div className="w-full max-w-md space-y-2">
            {segmentos.map((seg, idx) => (
              <div 
                key={seg.id} 
                onClick={() => onSelectLab(seg.lab)}
                className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-tech-blue/50 cursor-pointer transition-colors"
                title="Haz clic para ver el reporte detallado de este laboratorio"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span 
                    className="w-3 h-3 rounded-md flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">#{idx + 1}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                    {seg.nombre}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0 flex items-center space-x-1.5">
                  <span>{seg.valor} {unidad} ({seg.porcentaje}%)</span>
                  <Eye className="w-3.5 h-3.5 text-tech-blue" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-2">
          {laboratorios.map((lab, idx) => {
            const porcentajeAncho = Math.round((lab.valor / maxValor) * 100);
            const color = paletaColores[idx % paletaColores.length];

            return (
              <div 
                key={lab.laboratorioId} 
                onClick={() => onSelectLab(lab.lab)}
                className="space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Haz clic para ver el reporte detallado"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                    <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                    {lab.nombre}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>{lab.valor} {unidad}</span>
                    <Eye className="w-3.5 h-3.5 text-tech-blue" />
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(porcentajeAncho, 4)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
