import { useState } from 'react';
import { History, Search } from 'lucide-react';
import type { AuditoriaEvento } from '../../types';

interface TabAuditoriaProps {
  auditoriaList: AuditoriaEvento[];
  isLoading: boolean;
}

export default function TabAuditoria({ auditoriaList, isLoading }: TabAuditoriaProps) {
  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');

  const sanitizarAccion = (texto: string) => {
    return (texto || '')
      .replace(/\s*\(HU-\d+\)/gi, '')
      .replace(/\bHU-\d+\s*:?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const auditoriasFiltradas = auditoriaList.filter(a => {
    const q = busquedaAuditoria.toLowerCase();
    const acc = a.accion.toLowerCase();
    const usu = a.usuario?.nombreCompleto?.toLowerCase() || '';
    const cor = a.usuario?.correo?.toLowerCase() || '';
    return acc.includes(q) || usu.includes(q) || cor.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
            <History className="w-5 h-5 mr-2 text-tech-blue" />
            Auditoría de Sesiones y Accesos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historial de inicios de sesión, cambios de rol y eventos del sistema.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario o acción..."
            value={busquedaAuditoria}
            onChange={(e) => setBusquedaAuditoria(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Vista de Escritorio / Tablet Grande (Tabla con scroll protegido) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 min-w-[620px]">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading text-xs tracking-wide border-b border-slate-150 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                <th className="px-6 py-4 font-bold">Usuario Responsable</th>
                <th className="px-6 py-4 font-bold">Acción Realizada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : auditoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron registros de auditoría
                  </td>
                </tr>
              ) : (
                auditoriasFiltradas.map((aud) => {
                  const fecha = new Date(aud.fechaHora).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={aud.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                        {fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {aud.usuario ? (
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">
                              {aud.usuario.nombreCompleto}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {aud.usuario.correo}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sistema / Anónimo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {sanitizarAccion(aud.accion)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Móvil / Tablet Pequeña (Tarjetas Táctiles) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
          </div>
        ) : auditoriasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 text-slate-500 text-sm">
            No se encontraron registros de auditoría
          </div>
        ) : (
          auditoriasFiltradas.map((aud) => {
            const fecha = new Date(aud.fechaHora).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div
                key={aud.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    {fecha}
                  </span>
                  {aud.usuario ? (
                    <span className="text-[11px] font-semibold text-tech-blue dark:text-blue-400 truncate max-w-[150px]">
                      {aud.usuario.nombreCompleto}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Sistema</span>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700/60 text-xs">
                  <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {sanitizarAccion(aud.accion)}
                  </p>
                  {aud.usuario?.correo && (
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      {aud.usuario.correo}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}