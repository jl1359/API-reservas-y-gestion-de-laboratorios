import { Building2, BarChart3, PieChart } from 'lucide-react';

interface SegmentoPastelLab {
  id: number;
  nombre: string;
  total: number;
  porcentaje: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

interface MetricaLabItem {
  id: number;
  nombre: string;
  total: number;
  porcentaje: number;
}

interface ChartLaboratoriosReporteProps {
  formato: 'barras' | 'pastel';
  onToggleFormato: (formato: 'barras' | 'pastel') => void;
  segmentos: SegmentoPastelLab[];
  laboratoriosList?: MetricaLabItem[];
  maxReservas: number;
  paletaColores: string[];
  total: number;
  carreraId?: string;
  nombreCarreraFiltro?: string;
}

export default function ChartLaboratoriosReporte({
  formato,
  onToggleFormato,
  segmentos,
  laboratoriosList,
  maxReservas,
  paletaColores,
  total,
  carreraId,
  nombreCarreraFiltro
}: ChartLaboratoriosReporteProps) {
  return (
    <div className="mb-8 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-tech-blue" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Laboratorios Más Reservados {carreraId ? `(Carrera: ${nombreCarreraFiltro})` : '(Cuota de Demanda)'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Distribución de uso entre los laboratorios activos
            </p>
          </div>
        </div>

        <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleFormato('barras')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
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
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
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
                {total}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Reservas
              </span>
            </div>
          </div>

          <div className="w-full max-w-md space-y-2.5">
            {segmentos.map((seg, idx) => (
              <div key={seg.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
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
                <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                  {seg.total} reservas ({seg.porcentaje}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-2">
          {laboratoriosList?.map((lab, idx) => {
            const porcentajeAncho = Math.round((lab.total / maxReservas) * 100);
            const color = paletaColores[idx % paletaColores.length];

            return (
              <div key={lab.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                    <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                    {lab.nombre}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lab.total} reservas ({lab.porcentaje}%)
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
