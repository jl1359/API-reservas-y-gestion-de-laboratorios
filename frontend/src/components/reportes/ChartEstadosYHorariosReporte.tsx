import { PieChart, Clock } from 'lucide-react';

interface SegmentoPastelEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

interface FranjaHorariaItem {
  hora: number;
  etiqueta: string;
  cantidad: number;
}

interface DistribucionHorariaData {
  franjas: FranjaHorariaItem[];
  maximo: number;
}

interface ChartEstadosYHorariosReporteProps {
  tabAnalitica: 'integral' | 'carreras' | 'labs' | 'dias' | 'estados' | 'horarios';
  segmentosEstados: SegmentoPastelEstado[];
  porcentajeAsistencia: number;
  distribucionHoraria: DistribucionHorariaData;
}

export default function ChartEstadosYHorariosReporte({
  tabAnalitica,
  segmentosEstados,
  porcentajeAsistencia,
  distribucionHoraria
}: ChartEstadosYHorariosReporteProps) {
  if (tabAnalitica !== 'estados' && tabAnalitica !== 'horarios' && tabAnalitica !== 'integral') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Gráfico de Pastel de Estados */}
      {(tabAnalitica === 'estados' || tabAnalitica === 'integral') && (
        <div className={`${tabAnalitica === 'estados' ? 'lg:col-span-12 max-w-2xl mx-auto w-full' : 'lg:col-span-5'} bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60`}>
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="w-4 h-4 text-tech-blue" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Distribución Porcentual por Estado
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Asistencia, inasistencias y aprobaciones
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="14"
                  fill="transparent"
                />
                {segmentosEstados.map((seg, idx) => (
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
                  {porcentajeAsistencia}%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Asistencia
                </span>
              </div>
            </div>

            <div className="w-full space-y-2">
              {segmentosEstados.map((seg) => (
                <div key={seg.estado} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span 
                      className="w-3 h-3 rounded-md flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      {seg.estado}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                    {seg.cantidad} ({seg.porcentaje}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Barras de Horarios Pico */}
      {(tabAnalitica === 'horarios' || tabAnalitica === 'integral') && (
        <div className={`${tabAnalitica === 'horarios' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-tech-blue" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Ocupación por Franjas Horarias (Horarios Pico)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Concentración horaria para dimensionamiento de turnos
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Pico máx: {distribucionHoraria.maximo} reservas
            </span>
          </div>

          <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
            <div className="min-w-[480px] sm:min-w-full">
              <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-200 dark:border-slate-700">
            {distribucionHoraria.franjas.map((f, i) => {
              const alturaPct = Math.round((f.cantidad / distribucionHoraria.maximo) * 100);
              const tieneReservas = f.cantidad > 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {f.etiqueta}: <strong>{f.cantidad} reservas</strong>
                  </div>

                  {tieneReservas && (
                    <span className="text-[10px] font-bold text-tech-blue mb-1">
                      {f.cantidad}
                    </span>
                  )}

                  <div 
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                      tieneReservas 
                        ? 'bg-gradient-to-t from-tech-blue to-blue-400 group-hover:brightness-110 shadow-sm' 
                        : 'bg-slate-200/70 dark:bg-slate-700/50'
                    }`}
                    style={{ height: tieneReservas ? `${Math.max(alturaPct, 12)}%` : '6px' }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between gap-1 pt-2">
            {distribucionHoraria.franjas.map((f, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate" title={f.etiqueta}>
                  {f.etiqueta.split(' - ')[0]}
                </span>
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}