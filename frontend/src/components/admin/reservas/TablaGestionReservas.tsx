import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor,
  FileText
} from 'lucide-react';
import type { ReservaItem } from '../TabReservas';
import { imprimirBoletaOficial } from '../../../utils/boletaPdf';

interface TablaGestionReservasProps {
  reservas: ReservaItem[];
  isLoading: boolean;
  onAprobar: (id: number) => void;
  onAbrirRechazo: (reserva: ReservaItem) => void;
  onAbrirFuerzaMayor: (reserva: ReservaItem) => void;
}

export default function TablaGestionReservas({
  reservas,
  isLoading,
  onAprobar,
  onAbrirRechazo,
  onAbrirFuerzaMayor
}: TablaGestionReservasProps) {
  const renderEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Aprobada':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Aprobada
          </span>
        );
      case 'Completada':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle className="w-3 h-3 mr-1 text-blue-600" /> Completada
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pendiente
          </span>
        );
      case 'Ausente':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Ausente (Sanción 24h)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            {estado}
          </span>
        );
    }
  };

  return (
    <>
      {/* Vista de Tabla para Escritorio y Tablets Grandes */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading border-b border-slate-150 dark:border-slate-800 text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 font-bold">Laboratorio</th>
                <th className="px-6 py-4 font-bold">Docente / Titular</th>
                <th className="px-6 py-4 font-bold">Materia / Tipo</th>
                <th className="px-6 py-4 font-bold">Fecha y Horario</th>
                <th className="px-6 py-4 font-bold text-center">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : reservas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No se encontraron reservas registradas.</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o el término de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                reservas.map((res) => {
                  const start = new Date(res.fechaInicio);
                  const end = new Date(res.fechaFin);

                  return (
                    <tr
                      key={res.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{res.laboratorio?.nombre || 'Laboratorio'}</p>
                        <p className="text-xs text-slate-500">{res.laboratorio?.ubicacion || 'Campus Central'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{res.usuario?.nombreCompleto || 'Usuario del Campus'}</p>
                        <p className="text-xs text-slate-500">{res.usuario?.correo}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-tech-blue dark:text-blue-400">
                          {res.materia || 'Práctica Individual / Libre'}
                        </p>
                        {res.numeroComputadora ? (
                          <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-bold mt-1 border border-indigo-200 dark:border-indigo-800">
                            <Monitor className="w-3 h-3 mr-1" /> Estación #{res.numeroComputadora}
                          </span>
                        ) : (
                          <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold mt-1">
                            Aula completa ({res.cantidadAlumnos || 1} alumnos)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {start.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                          <Clock className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderEstadoBadge(res.estado)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {res.estado === 'Pendiente' && (
                          <>
                            <button
                              onClick={() => onAprobar(res.id)}
                              title="Aprobar Reserva Manualmente"
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onAbrirRechazo(res)}
                              title="Rechazar Reserva"
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {res.estado === 'Aprobada' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => imprimirBoletaOficial(res as any)}
                              title="Imprimir Boleta Oficial de Acreditación PDF"
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Boleta
                            </button>
                            <button
                              onClick={() => onAbrirFuerzaMayor(res)}
                              title="Cancelar por Fuerza Mayor"
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/30 rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                              Fuerza Mayor
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de Tarjetas Móvil para Reservas (Smartphones y Tablets) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
          </div>
        ) : reservas.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-slate-500 text-sm">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-medium">No se encontraron reservas registradas.</p>
          </div>
        ) : (
          reservas.map((res) => {
            const start = new Date(res.fechaInicio);
            const end = new Date(res.fechaFin);

            return (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm truncate">
                      {res.laboratorio?.nombre || 'Laboratorio'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {res.laboratorio?.ubicacion || 'Campus Central'}
                    </p>
                  </div>
                  <div className="shrink-0">{renderEstadoBadge(res.estado)}</div>
                </div>

                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-xs space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Titular: <span className="font-normal text-slate-600 dark:text-slate-400">{res.usuario?.nombreCompleto}</span>
                  </p>
                  <p className="text-slate-500 truncate">{res.usuario?.correo}</p>
                  <div className="pt-1 flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-tech-blue dark:text-blue-400 truncate max-w-[180px]">
                      {res.materia || 'Práctica Libre'}
                    </span>
                    <span>
                      {res.numeroComputadora ? `PC #${res.numeroComputadora}` : `${res.cantidadAlumnos || 1} alumnos`}
                    </span>
                  </div>
                  <p className="text-slate-500 pt-0.5 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-tech-blue shrink-0" />
                    {start.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}, {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Acciones móviles */}
                {res.estado === 'Pendiente' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onAprobar(res.id)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Aprobar</span>
                    </button>
                    <button
                      onClick={() => onAbrirRechazo(res)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}

                {res.estado === 'Aprobada' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => imprimirBoletaOficial(res as any)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Boleta PDF</span>
                    </button>
                    <button
                      onClick={() => onAbrirFuerzaMayor(res)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30 font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Fuerza Mayor</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
