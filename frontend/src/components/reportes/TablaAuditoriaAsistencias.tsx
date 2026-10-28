import {
  FileText,
  Clock,
  GraduationCap,
  MapPin,
  User,
  Monitor,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export interface UsuarioReserva {
  id: number;
  nombreCompleto: string;
  correo: string;
  ci?: string | null;
}

export interface LaboratorioReserva {
  id: number;
  nombre: string;
  ubicacion?: string | null;
  carrera?: { id: number; nombre: string } | null;
}

export interface ReservaReporte {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  motivo?: string | null;
  materia?: string | null;
  numeroComputadora?: number | null;
  horaAsistencia?: string | null;
  usuario?: UsuarioReserva | null;
  laboratorio?: LaboratorioReserva | null;
}

interface TablaAuditoriaAsistenciasProps {
  reservas?: ReservaReporte[];
  isLoading: boolean;
  modoAuditoria: 'dia' | 'rango';
  fecha: string;
  fechaInicio: string;
  fechaFin: string;
  carreraId?: string;
  laboratorioId?: string;
  nombreCarreraFiltro?: string;
}

const formatearFecha = (fechaIso: string) => {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const formatearHora = (fechaIso: string) => {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatearHoraExacta = (fechaIso: string) => {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const renderBadgeEstado = (estado: string) => {
  switch (estado) {
    case 'Asistió':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Asistió
        </span>
      );
    case 'Ausente':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Ausente
        </span>
      );
    case 'Aprobada':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Aprobada
        </span>
      );
    case 'Cancelada':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          Cancelada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 mr-1" />
          {estado}
        </span>
      );
  }
};

export default function TablaAuditoriaAsistencias({
  reservas = [],
  isLoading,
  modoAuditoria,
  fecha,
  fechaInicio,
  fechaFin,
  carreraId,
  laboratorioId,
  nombreCarreraFiltro
}: TablaAuditoriaAsistenciasProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-poppins font-bold text-slate-900 dark:text-white text-lg">
            Detalle de Asistencias y Reservas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {modoAuditoria === 'rango' 
              ? `Registros entre ${formatearFecha(fechaInicio)} y ${formatearFecha(fechaFin)}`
              : `Registros para el día ${formatearFecha(fecha)}`}
            {carreraId ? ` • Filtrado por carrera: ${nombreCarreraFiltro}` : ''}
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total listado: <strong>{reservas.length}</strong>
        </span>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-blue"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando reporte de asistencias...</p>
        </div>
      ) : reservas.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
            No se encontraron reservas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No hay actividades registradas para los filtros seleccionados
            {laboratorioId ? ' en este laboratorio' : ''}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[850px]">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-5 py-3.5">Fecha y Horario</th>
                <th scope="col" className="px-5 py-3.5">Carrera / Laboratorio</th>
                <th scope="col" className="px-5 py-3.5">Docente / Usuario</th>
                <th scope="col" className="px-5 py-3.5">Modalidad</th>
                <th scope="col" className="px-5 py-3.5">Estado</th>
                <th scope="col" className="px-5 py-3.5">Ingreso / Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {reservas.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                  
                  {/* Fecha y Horario */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-white text-xs mb-0.5">
                      {formatearFecha(r.fechaInicio)}
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatearHora(r.fechaInicio)} - {formatearHora(r.fechaFin)}</span>
                    </div>
                  </td>

                  {/* Carrera / Laboratorio */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {r.laboratorio?.nombre || 'Laboratorio N/A'}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {r.laboratorio?.carrera?.nombre || 'General / Sin Asignar'}
                      </span>
                      {r.laboratorio?.ubicacion && (
                        <span className="flex items-center text-slate-400 text-[11px]">
                          <MapPin className="w-3 h-3 mr-0.5" />
                          {r.laboratorio.ubicacion}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Usuario */}
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {r.usuario?.nombreCompleto || 'Usuario'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {r.usuario?.correo}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Modalidad */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {r.numeroComputadora ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-tech-blue dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Monitor className="w-3.5 h-3.5 mr-1" />
                        PC #{r.numeroComputadora}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 mr-1" />
                        Lab. Completo
                      </span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {renderBadgeEstado(r.estado)}
                  </td>

                  {/* Sello de Asistencia */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {r.horaAsistencia ? (
                      <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Confirmada a las {formatearHoraExacta(r.horaAsistencia)}</span>
                      </div>
                    ) : r.estado === 'Ausente' ? (
                      <div className="text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center space-x-1">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>Inasistencia registrada</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pendiente de escaneo QR</span>
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}