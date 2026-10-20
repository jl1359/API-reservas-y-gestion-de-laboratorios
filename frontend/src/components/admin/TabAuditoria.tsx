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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <History className="w-5 h-5 mr-2 text-tech-blue" />
            Auditoría de Sesiones y Accesos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro cronológico inmutable de logins, asignación de roles, cancelaciones y validaciones QR.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario o acción..."
            value={busquedaAuditoria}
            onChange={(e) => setBusquedaAuditoria(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-tech-blue outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins text-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                <th className="px-6 py-4 font-bold">Usuario Responsable</th>
                <th className="px-6 py-4 font-bold">Acción Realizada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
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
    </div>
  );
}
