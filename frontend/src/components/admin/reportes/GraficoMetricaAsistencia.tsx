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
  return (
    <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
      <div className="mb-4">
        <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          Porcentaje de Asistencia por Laboratorio
        </h5>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Asistencia promedio del campus: <strong>{metricasData.tasaAsistenciaPromedio}%</strong>
        </p>
      </div>

      <div className="space-y-3 py-2">
        {metricasData.laboratorios.map((lab) => {
          const colorBarra = 
            lab.tasaAsistencia >= 80 
              ? 'bg-emerald-500' 
              : lab.tasaAsistencia >= 50 
              ? 'bg-amber-500' 
              : 'bg-rose-500';

          return (
            <div 
              key={lab.laboratorioId} 
              onClick={() => onSelectLab(lab)}
              className="space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Haz clic para ver el reporte detallado"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {lab.nombre}
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span>{lab.tasaAsistencia}% ({lab.reservasAsistidas} asistidas / {lab.reservasAusentes} ausentes)</span>
                  <Eye className="w-3.5 h-3.5 text-tech-blue" />
                </span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
                  style={{ width: `${Math.max(lab.tasaAsistencia, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}