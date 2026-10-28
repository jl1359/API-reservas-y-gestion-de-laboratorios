import { GraduationCap, Eye } from 'lucide-react';
import type { ResumenMetricasAcademicas, MetricasLaboratorio } from '../../../types';

interface TablaMetricasInstitucionalProps {
  metricasData: ResumenMetricasAcademicas | null;
  isLoadingMetricas: boolean;
  onSelectLab: (lab: MetricasLaboratorio) => void;
}

export default function TablaMetricasInstitucional({
  metricasData,
  isLoadingMetricas,
  onSelectLab
}: TablaMetricasInstitucionalProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
        <h4 className="font-poppins font-bold text-slate-900 dark:text-white text-sm">
          Resumen de Uso por Laboratorio
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Laboratorios evaluados: <strong>{metricasData?.laboratorios?.length || 0}</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
            <tr>
              <th className="px-5 py-3.5 font-bold">Laboratorio</th>
              <th className="px-4 py-3.5 font-bold">Capacidad</th>
              <th className="px-4 py-3.5 font-bold">Total Reservas</th>
              <th className="px-4 py-3.5 font-bold">Horas Uso</th>
              <th className="px-4 py-3.5 font-bold">Asistencia</th>
              <th className="px-4 py-3.5 font-bold">Estudiantes Asistentes</th>
              <th className="px-5 py-3.5 font-bold text-center">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {isLoadingMetricas ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                </td>
              </tr>
            ) : !metricasData || metricasData.laboratorios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No hay registros de uso en el rango seleccionado
                </td>
              </tr>
            ) : (
              metricasData.laboratorios.map((lab) => (
                <tr
                  key={lab.laboratorioId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-white">{lab.nombre}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <GraduationCap className="w-2.5 h-2.5 mr-1 text-slate-400" />
                        {lab.carreraNombre || 'General / Central'}
                      </span>
                      {lab.ubicacion && (
                        <span className="text-[11px] text-slate-400">{lab.ubicacion}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{lab.capacidad} Asientos</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{lab.totalReservas}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-tech-blue">{lab.horasUsoEfectivo} hrs</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        lab.tasaAsistencia >= 80
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : lab.tasaAsistencia >= 50
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      {lab.tasaAsistencia}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{lab.alumnosBeneficiados}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectLab(lab)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-tech-blue hover:text-white bg-blue-50 dark:bg-blue-900/30 hover:bg-tech-blue dark:hover:bg-tech-blue rounded-lg border border-blue-200 dark:border-blue-800 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Detalle</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}