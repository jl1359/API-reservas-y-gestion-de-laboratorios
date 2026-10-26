import { Clock, CheckCircle2, Users, Building2 } from 'lucide-react';
import type { ResumenMetricasAcademicas } from '../../../types';

interface KpiCardsReportesProps {
  metricasData: ResumenMetricasAcademicas | null;
}

export default function KpiCardsReportes({ metricasData }: KpiCardsReportesProps) {
  if (!metricasData) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold">Horas de Práctica Efectiva</p>
          <p className="text-2xl font-bold font-heading text-tech-blue mt-1">
            {metricasData.totalHorasCampus} hrs
          </p>
          <p className="text-[11px] text-slate-400 mt-1">En el período seleccionado</p>
        </div>
        <div className="p-3 bg-blue-500/10 text-tech-blue rounded-2xl">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold">Tasa de Asistencia Global</p>
          <p className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1">
            {metricasData.tasaAsistenciaPromedio}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Aprovechamiento de aforo</p>
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold">Estudiantes Beneficiados</p>
          <p className="text-2xl font-bold font-heading text-indigo-600 dark:text-indigo-400 mt-1">
            {metricasData.totalAlumnosBeneficiados}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Alumnos que cursaron prácticas</p>
        </div>
        <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
          <Users className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-xs text-slate-500 uppercase font-semibold">Laboratorio Top Demanda</p>
          <p className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1 truncate" title={metricasData.laboratorioMasDemandado}>
            {metricasData.laboratorioMasDemandado}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Mayor frecuencia de uso</p>
        </div>
        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex-shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}