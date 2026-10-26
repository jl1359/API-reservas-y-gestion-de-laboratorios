import { Building2, GraduationCap, X, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MetricasLaboratorio } from '../../../types';

interface ModalDetalleLabReporteProps {
  lab: MetricasLaboratorio | null;
  onClose: () => void;
}

export default function ModalDetalleLabReporte({ lab, onClose }: ModalDetalleLabReporteProps) {
  if (!lab) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Cabecera del Modal */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/80 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-tech-blue dark:text-blue-400 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
                {lab.nombre}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {lab.carreraNombre || 'General / Central'}
                </span>
                <span>•</span>
                <span>{lab.ubicacion || 'Campus Central'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Reporte Detallado */}
        <div className="p-6 space-y-6">
          
          {/* Cuadrícula de Métricas Principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] uppercase font-bold text-slate-400">Práctica Efectiva</p>
              <p className="text-lg font-bold font-poppins text-tech-blue mt-1">
                {lab.horasUsoEfectivo} hrs
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Reservas</p>
              <p className="text-lg font-bold font-poppins text-slate-900 dark:text-white mt-1">
                {lab.totalReservas}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] uppercase font-bold text-slate-400">Estudiantes</p>
              <p className="text-lg font-bold font-poppins text-indigo-600 dark:text-indigo-400 mt-1">
                {lab.alumnosBeneficiados}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] uppercase font-bold text-slate-400">Capacidad</p>
              <p className="text-lg font-bold font-poppins text-slate-900 dark:text-white mt-1">
                {lab.capacidad} Asientos
              </p>
            </div>
          </div>

          {/* Aprovechamiento de Aforo y Tasa de Asistencia */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Tasa de Asistencia Efectiva:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                lab.tasaAsistencia >= 80
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : lab.tasaAsistencia >= 50
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              }`}>
                {lab.tasaAsistencia}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  lab.tasaAsistencia >= 80 ? 'bg-emerald-500' : lab.tasaAsistencia >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(lab.tasaAsistencia, 3)}%` }}
              />
            </div>
          </div>

          {/* Desglose de Estado de Reservas */}
          <div>
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Desglose de Reservas en este Laboratorio
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold block text-base">
                  {lab.reservasAsistidas}
                </span>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 flex items-center mt-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Asistidas
                </span>
              </div>

              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <span className="text-rose-700 dark:text-rose-400 font-bold block text-base">
                  {lab.reservasAusentes}
                </span>
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 flex items-center mt-0.5">
                  <XCircle className="w-3 h-3 mr-1" /> Inasistencias
                </span>
              </div>

              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-blue-700 dark:text-blue-400 font-bold block text-base">
                  {lab.reservasAprobadas}
                </span>
                <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 flex items-center mt-0.5">
                  <Clock className="w-3 h-3 mr-1" /> Aprobadas
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600">
                <span className="text-slate-700 dark:text-slate-300 font-bold block text-base">
                  {lab.reservasCanceladas}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                  <X className="w-3 h-3 mr-1" /> Canceladas
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Pie del Modal */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <Link
            to={`/reportes/asistencias?laboratorioId=${lab.laboratorioId}`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-tech-blue hover:underline"
          >
            <FileText className="w-4 h-4" />
            <span>Auditar asistencias individuales de este laboratorio</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
}
