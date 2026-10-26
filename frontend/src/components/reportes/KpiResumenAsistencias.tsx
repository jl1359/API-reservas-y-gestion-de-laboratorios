import {
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  GraduationCap,
  Award,
  Building2,
  TrendingUp,
  CalendarRange
} from 'lucide-react';

interface KpiResumenAsistenciasProps {
  modoAuditoria: 'dia' | 'rango';
  total: number;
  asistencias: number;
  ausencias: number;
  porcentajeAsistencia: number;
  carreraTop?: { nombre: string; total: number; porcentaje: number } | null;
  labTop?: { nombre: string; total: number; porcentaje: number } | null;
  diaTop?: { fecha: string; diaSemana: string; total: number; porcentaje: number } | null;
  isLoading: boolean;
  formatearFecha: (d: string) => string;
}

export default function KpiResumenAsistencias({
  modoAuditoria,
  total,
  asistencias,
  ausencias,
  porcentajeAsistencia,
  carreraTop,
  labTop,
  diaTop,
  isLoading,
  formatearFecha
}: KpiResumenAsistenciasProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
      {/* Total Reservas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {modoAuditoria === 'dia' ? 'Reservas Día' : 'Reservas Período'}
          </p>
          <p className="text-2xl font-poppins font-bold text-slate-900 dark:text-white mt-0.5">
            {isLoading ? '--' : total}
          </p>
          <span className="text-[10px] text-slate-400">Programadas</span>
        </div>
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-tech-blue dark:text-blue-400 rounded-xl">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      {/* Asistencias Confirmadas por QR */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div>
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Asistencias
          </p>
          <p className="text-2xl font-poppins font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
            {isLoading ? '--' : asistencias}
          </p>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
            {porcentajeAsistencia}% asistencia
          </span>
        </div>
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* Inasistencias */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div>
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Inasistencias
          </p>
          <p className="text-2xl font-poppins font-bold text-rose-700 dark:text-rose-300 mt-0.5">
            {isLoading ? '--' : ausencias}
          </p>
          <span className="text-[10px] text-rose-500/80">Usuarios ausentes</span>
        </div>
        <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
          <XCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Carrera Más Activa */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div className="min-w-0 pr-1.5">
          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center">
            <BookOpen className="w-3 h-3 mr-1" /> Carrera Top
          </p>
          <p className="text-xs font-poppins font-bold text-slate-900 dark:text-white mt-1 truncate" title={carreraTop?.nombre || 'Sin reservas'}>
            {isLoading ? '--' : carreraTop ? carreraTop.nombre : 'Sin reservas'}
          </p>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
            {carreraTop ? `${carreraTop.total} res. (${carreraTop.porcentaje}%)` : '0 registros'}
          </span>
        </div>
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
      </div>

      {/* Laboratorio Más Demandado */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div className="min-w-0 pr-1.5">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center">
            <Award className="w-3 h-3 mr-1" /> Lab. Top
          </p>
          <p className="text-xs font-poppins font-bold text-slate-900 dark:text-white mt-1 truncate" title={labTop?.nombre || 'Sin reservas'}>
            {isLoading ? '--' : labTop ? labTop.nombre : 'Sin reservas'}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
            {labTop ? `${labTop.total} res. (${labTop.porcentaje}%)` : '0 registros'}
          </span>
        </div>
        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
      </div>

      {/* Día con Mayor Demanda */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div className="min-w-0 pr-1.5">
          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Día Pico
          </p>
          <p className="text-xs font-poppins font-bold text-slate-900 dark:text-white mt-1 truncate">
            {isLoading ? '--' : diaTop ? `${diaTop.diaSemana} ${formatearFecha(diaTop.fecha)}` : 'Sin registros'}
          </p>
          <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold">
            {diaTop ? `${diaTop.total} res. (${diaTop.porcentaje}%)` : '0 registros'}
          </span>
        </div>
        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex-shrink-0">
          <CalendarRange className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
}