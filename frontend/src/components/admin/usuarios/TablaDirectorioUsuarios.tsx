import { Phone, ShieldCheck } from 'lucide-react';
import type { Usuario, Rol } from '../../../types';

interface TablaDirectorioUsuariosProps {
  usuarios: Usuario[];
  rolesList: Rol[];
  isLoading: boolean;
  onCambiarRol: (usuarioId: number, nuevoRolId: number, nombre: string) => void;
  onAbrirSuspension: (usuario: Usuario) => void;
  onHabilitarCuenta: (usuario: Usuario) => void;
}

export default function TablaDirectorioUsuarios({
  usuarios,
  rolesList,
  isLoading,
  onCambiarRol,
  onAbrirSuspension,
  onHabilitarCuenta
}: TablaDirectorioUsuariosProps) {
  return (
    <>
      {/* Vista de Tabla Escritorio */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading border-b border-slate-150 dark:border-slate-800 text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 font-bold">Usuario</th>
                <th className="px-6 py-4 font-bold">Contacto</th>
                <th className="px-6 py-4 font-bold">Rol Asignado</th>
                <th className="px-6 py-4 font-bold">Estado de Cuenta</th>
                <th className="px-6 py-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron usuarios coincidentes
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const esAdminUsuario = u.rol?.nombre === 'Admin' || u.rol?.nombre === 'Administrador' || u.rolId === 1;

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{u.nombreCompleto}</p>
                        <p className="text-xs text-slate-500">{u.correo}</p>
                        {u.ci && <p className="text-[11px] font-mono text-slate-400 mt-0.5">CI: {u.ci}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                          {u.telefono || 'Sin teléfono'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {esAdminUsuario ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                            Administrador
                          </span>
                        ) : (
                          <select
                            value={u.rolId}
                            onChange={(e) => onCambiarRol(u.id, Number(e.target.value), u.nombreCompleto)}
                            className="text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-tech-blue"
                            title="Cambiar rol institucional directamente"
                          >
                            {rolesList.map((r) => (
                              <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                {r.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.activo !== false
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                          }`}
                        >
                          {u.activo !== false ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {esAdminUsuario ? (
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 italic px-3 py-1.5">
                            Superusuario
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (u.activo !== false) {
                                onAbrirSuspension(u);
                              } else {
                                onHabilitarCuenta(u);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors shadow-sm cursor-pointer ${
                              u.activo !== false
                                ? 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30'
                                : 'text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30'
                            }`}
                          >
                            {u.activo !== false ? 'Suspender' : 'Habilitar'}
                          </button>
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

      {/* Vista Móvil de Directorio de Usuarios */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-slate-500 text-sm">
            No se encontraron usuarios coincidentes
          </div>
        ) : (
          usuarios.map((u) => {
            const esAdminUsuario = u.rol?.nombre === 'Admin' || u.rol?.nombre === 'Administrador' || u.rolId === 1;
            return (
              <div
                key={u.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                      {u.nombreCompleto}
                    </h4>
                    <p className="text-xs text-slate-500">{u.correo}</p>
                    {u.ci && <p className="text-[11px] font-mono text-slate-400 mt-0.5">CI: {u.ci}</p>}
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.activo !== false
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {u.activo !== false ? 'Activo' : 'Suspendido'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Rol</span>
                    {esAdminUsuario ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <select
                        value={u.rolId}
                        onChange={(e) => onCambiarRol(u.id, Number(e.target.value), u.nombreCompleto)}
                        className="w-full text-xs font-medium px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                      >
                        {rolesList.map((r) => (
                          <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r.nombre}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Teléfono</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium py-1">{u.telefono || 'Sin teléfono'}</p>
                  </div>
                </div>

                {!esAdminUsuario && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        if (u.activo !== false) {
                          onAbrirSuspension(u);
                        } else {
                          onHabilitarCuenta(u);
                        }
                      }}
                      className={`w-full py-2 text-xs font-semibold rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                        u.activo !== false
                          ? 'text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/20'
                          : 'text-emerald-600 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/20'
                      }`}
                    >
                      {u.activo !== false ? 'Suspender Cuenta' : 'Habilitar Cuenta'}
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