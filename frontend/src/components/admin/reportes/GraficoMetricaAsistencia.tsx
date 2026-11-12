import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import type { ResumenMetricasAcademicas, MetricasLaboratorio } from '../../../types';

interface GraficoMetricaAsistenciaProps {
  metricasData: ResumenMetricasAcademicas;
  onSelectLab: (lab: MetricasLaboratorio) => void;
}

export default function GraficoMetricaAsistencia({
  metricasData,
  onSelectLab
}: GraficoMetricaAsistenciaProps) {
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
  }, [metricasData]);

  const laboratoriosOrdenados = [...(metricasData.laboratorios || [])].sort((a, b) => {
    if (b.tasaAsistencia !== a.tasaAsistencia) {
      return b.tasaAsistencia - a.tasaAsistencia;
    }
    return b.reservasAsistidas - a.reservasAsistidas;
  });

  const animatedPromedio = Math.round(metricasData.tasaAsistenciaPromedio * counterProgress);

  return (
    <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
      <div className="mb-4">
        <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          Porcentaje de Asistencia por Laboratorio
        </h5>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Asistencia promedio del campus: <strong className="text-emerald-600 dark:text-emerald-400">{animatedPromedio}%</strong>
        </p>
      </div>

      <div className="space-y-3 py-2">
        {laboratoriosOrdenados.map((lab) => {
          const colorBarra = 
            lab.tasaAsistencia >= 80 
              ? 'bg-emerald-500' 
              : lab.tasaAsistencia >= 50 
              ? 'bg-amber-500' 
              : 'bg-rose-500';

          const targetWidth = Math.max(lab.tasaAsistencia, 3);
          const animatedTasa = Math.round(lab.tasaAsistencia * counterProgress);

          return (
            <div 
              key={lab.laboratorioId}
              onClick={() => onSelectLab(lab)}
              className="group space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-150 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
              title="Haz clic para inspeccionar este laboratorio"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                  {lab.nombre}
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 font-poppins">
                  <span>{animatedTasa}%</span>
                  <Eye className="w-3.5 h-3.5 text-tech-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
              <div className="w-full bg-slate-200/70 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${colorBarra}`}
                  style={{ 
                    width: isAnimated ? `${targetWidth}%` : '0%',
                    transition: 'width 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'width'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
