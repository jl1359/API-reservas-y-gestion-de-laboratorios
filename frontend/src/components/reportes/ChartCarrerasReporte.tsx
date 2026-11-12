import { useState, useEffect } from 'react';
import { GraduationCap, BarChart3, PieChart } from 'lucide-react';

interface SegmentoPastelCarrera {
  id?: number;
  nombre: string;
  total: number;
  porcentaje: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

interface MetricaCarreraItem {
  id?: number;
  nombre: string;
  total: number;
  porcentaje: number;
}

interface ChartCarrerasReporteProps {
  formato: 'barras' | 'pastel';
  onToggleFormato: (formato: 'barras' | 'pastel') => void;
  segmentos: SegmentoPastelCarrera[];
  carrerasList?: MetricaCarreraItem[];
  maxReservas: number;
  paletaColores: string[];
  onSelectCarrera: (id: number, nombre: string) => void;
}

export default function ChartCarrerasReporte({
  formato,
  onToggleFormato,
  segmentos,
  carrerasList,
  maxReservas,
  paletaColores,
  onSelectCarrera
}: ChartCarrerasReporteProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [counterProgress, setCounterProgress] = useState(0);

  useEffect(() => {
    setIsAnimated(false);
    setCounterProgress(0);

    const rAF = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    const startTime = performance.now();
    const duration = 850;
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounterProgress(eased);
      if (p >= 1) clearInterval(interval);
    }, 32);

    return () => {
      cancelAnimationFrame(rAF);
      clearInterval(interval);
    };
  }, [formato, segmentos.length]);

  const CIRCUNFERENCIA = 2 * Math.PI * 40;

  return (
    <div className="mb-8 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-tech-blue" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Uso de Laboratorios por Carrera
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cantidad de reservas y uso comparativo por carrera
            </p>
          </div>
        </div>

        <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleFormato('barras')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all duration-150 ${
              formato === 'barras'
                ? 'bg-tech-blue text-white font-medium shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Barras</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleFormato('pastel')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all duration-150 ${
              formato === 'pastel'
                ? 'bg-tech-blue text-white font-medium shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Pastel</span>
          </button>
        </div>
      </div>

      {formato === 'pastel' ? (
        <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
          <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200 dark:stroke-slate-700/60"
                strokeWidth="14"
                fill="transparent"
              />
              {segmentos.map((seg, idx) => {
                return (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={isAnimated ? seg.strokeDasharray : `0 ${CIRCUNFERENCIA}`}
                    strokeDashoffset={isAnimated ? seg.strokeDashoffset : 0}
                    fill="transparent"
                    className="hover:opacity-80 transition-opacity"
                    style={{
                      transition: 'stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                      willChange: 'stroke-dasharray, stroke-dashoffset'
                    }}
                  />
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-poppins font-extrabold text-slate-900 dark:text-white leading-none">
                {Math.round((carrerasList?.length || 0) * counterProgress)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Carreras
              </span>
            </div>
          </div>

          <div className="w-full max-w-md space-y-2.5">
            {segmentos.map((seg, idx) => {
              const animatedVal = Math.round(seg.total * counterProgress);
              const animatedPct = Math.round(seg.porcentaje * counterProgress);

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (seg.id) {
                      onSelectCarrera(seg.id, seg.nombre);
                    }
                  }}
                  className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-tech-blue/50 cursor-pointer transition-colors duration-150"
                  title="Haz clic para filtrar la auditoría por esta carrera"
                >
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <span 
                      className="w-3 h-3 rounded-md flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-400 font-bold text-[10px]">#{idx + 1}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                      {seg.nombre}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {animatedVal} reservas
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({animatedPct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-2">
          {carrerasList?.map((c, idx) => {
            const color = paletaColores[idx % paletaColores.length];
            const targetWidth = maxReservas > 0 ? (c.total / maxReservas) * 100 : 0;
            const animatedVal = Math.round(c.total * counterProgress);

            return (
              <div 
                key={c.id || idx}
                onClick={() => {
                  if (c.id) {
                    onSelectCarrera(c.id, c.nombre);
                  }
                }}
                className="space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/80 cursor-pointer transition-colors duration-150"
                title="Haz clic para filtrar la auditoría por esta carrera"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                    {c.nombre}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {animatedVal} reservas ({Math.round(c.porcentaje * counterProgress)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: isAnimated ? `${targetWidth}%` : '0%', 
                      backgroundColor: color,
                      transition: 'width 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                      willChange: 'width'
                    }}
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
