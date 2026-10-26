import { CalendarRange, BarChart3, PieChart } from 'lucide-react';

interface SegmentoPastelDia {
  fecha: string;
  diaSemana: string;
  total: number;
  porcentaje: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

interface MetricaDiaItem {
  fecha: string;
  diaSemana: string;
  total: number;
  porcentaje: number;
}

interface ChartDiasReporteProps {
  formato: 'barras' | 'pastel';
  onToggleFormato: (formato: 'barras' | 'pastel') => void;
  segmentos: SegmentoPastelDia[];
  diasList?: MetricaDiaItem[];
  maxDiaReservas: number;
  diaTop?: MetricaDiaItem | null;
  totalDias: number;
}

export default function ChartDiasReporte({
  formato,
  onToggleFormato,
  segmentos,
  diasList,
  maxDiaReservas,
  diaTop,
  totalDias
}: ChartDiasReporteProps) {
  return (
    <div className="mb-8 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <CalendarRange className="w-4 h-4 text-tech-blue" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Demanda por Días
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Evolución cronológica de las actividades de laboratorio
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

      {formato === 'barras' ? (
        <div className="pt-4">
          <div className="h-44 flex items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            {diasList?.map((d, i) => {
              const alturaPct = Math.round((d.total / maxDiaReservas) * 100);
              const esPico = diaTop?.fecha === d.fecha;

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[20px]">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {d.diaSemana} {d.fecha}: <strong>{d.total} reservas ({d.porcentaje}%)</strong>
                  </div>

                  <span className={`text-[10px] font-bold mb-1 ${esPico ? 'text-purple-600 dark:text-purple-400' : 'text-tech-blue'}`}>
                    {d.total}
                  </span>

                  <div
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                      esPico
                        ? 'bg-gradient-to-t from-purple-600 to-indigo-400 shadow-sm'
                        : 'bg-gradient-to-t from-tech-blue to-blue-400 group-hover:brightness-110 shadow-sm'
                    }`}
                    style={{ height: `${Math.max(alturaPct, 12)}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between gap-1 pt-2">
            {diasList?.map((d, i) => (
              <div key={i} className="flex-1 text-center min-w-[20px]">
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate" title={`${d.diaSemana} ${d.fecha}`}>
                  {d.fecha.slice(5)} {d.diaSemana.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
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
              {segmentos.map((seg, idx) => (
                <circle
                  key={idx}
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
                {totalDias}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Días con Uso
              </span>
            </div>
          </div>

          <div className="w-full max-w-md space-y-2">
            {segmentos.map((seg, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center space-x-2 truncate">
                  <span
                    className="w-3 h-3 rounded-md flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {seg.diaSemana} ({seg.fecha})
                  </span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                  {seg.total} reservas ({seg.porcentaje}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}