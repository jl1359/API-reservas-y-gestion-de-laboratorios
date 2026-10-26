import { Users, CheckCircle, XCircle } from 'lucide-react';
import type { SolicitudRolItem } from './ModalRechazarSolicitudRol';

interface TablaSolicitudesRolProps {
  solicitudes: SolicitudRolItem[];
  isLoading: boolean;
  onAprobar: (id: number, nombre: string, rol: string) => void;
  onAbrirRechazar: (solicitud: SolicitudRolItem) => void;
}

export default function TablaSolicitudesRol({
  solicitudes,
  isLoading,
  onAprobar,
  onAbrirRechazar
}: TablaSolicitudesRolProps) {
  return (
    <>
      {/* Vista Escritorio Solicitudes */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading border-b border-slate-150 dark:border-slate-800 text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 font-bold">Usuario</th>
                <th className="px-6 py-4 font-bold">Rol Actual</th>
                <th className="px-6 py-4 font-bold">Solicita</th>
                <th className="px-6 py-4 font-bold">Motivo</th>
                <th className="px-6 py-4 font-bold text-right">Decisión</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay solicitudes pendientes.</p>
                  </td>
                </tr>
              ) : (
                solicitudes.map((sol) => (
                  <tr
                    key={sol.id}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{sol.usuario.nombreCompleto}</p>
                      <p className="text-xs text-slate-500">{sol.usuario.correo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-semibold">
                        {typeof sol.usuario.rol === 'object' ? sol.usuario.rol?.nombre : sol.usuario.rol || 'Estudiante'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-tech-blue dark:text-blue-400">{sol.rolSolicitado}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={sol.motivo}>
                      {sol.motivo}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onAprobar(sol.id, sol.usuario.nombreCompleto, sol.rolSolicitado)}
                          title="Aprobar Solicitud"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 active:scale-[0.98] cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAbrirRechazar(sol)}
                          title="Rechazar Solicitud"
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 active:scale-[0.98] cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Móvil Solicitudes */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-slate-500 text-sm">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-medium">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          solicitudes.map((sol) => (
            <div
              key={sol.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                    {sol.usuario.nombreCompleto}
                  </h4>
                  <p className="text-xs text-slate-500">{sol.usuario.correo}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-tech-blue dark:text-blue-400">
                  {sol.rolSolicitado}
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-xs space-y-1">
                <p className="text-slate-500">
                  Rol actual: <span className="font-semibold text-slate-700 dark:text-slate-300">{typeof sol.usuario.rol === 'object' ? sol.usuario.rol?.nombre : sol.usuario.rol || 'Estudiante'}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400 italic pt-1">
                  "{sol.motivo}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onAprobar(sol.id, sol.usuario.nombreCompleto, sol.rolSolicitado)}
                  className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Aprobar</span>
                </button>
                <button
                  onClick={() => onAbrirRechazar(sol)}
                  className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rechazar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}