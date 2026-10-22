import { useState } from 'react';
import axios from 'axios';
import { Search, Phone, CheckCircle, XCircle, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { usuariosApi } from '../../api/usuarios.api';
import type { Usuario, Rol } from '../../types';

export interface SolicitudRolItem {
  id: number;
  rolSolicitado: string;
  motivo: string;
  estado: string;
  createdAt?: string;
  usuario: {
    nombreCompleto: string;
    correo: string;
    rol: { nombre: string } | string;
  };
}

interface TabUsuariosProps {
  usuariosList: Usuario[];
  rolesList: Rol[];
  solicitudes: SolicitudRolItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TabUsuarios({
  usuariosList,
  rolesList,
  solicitudes,
  isLoading,
  onRefresh
}: TabUsuariosProps) {
  const [subTabUsuarios, setSubTabUsuarios] = useState<'directorio' | 'solicitudes'>('directorio');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  const usuariosFiltrados = usuariosList.filter((u) => {
    const q = busquedaUsuario.toLowerCase();
    const nom = u.nombreCompleto?.toLowerCase() || '';
    const cor = u.correo?.toLowerCase() || '';
    const ciVal = (u.ci || '').toLowerCase();
    const telVal = (u.telefono || '').toLowerCase();
    const rol = typeof u.rol === 'object' ? u.rol?.nombre?.toLowerCase() || '' : String(u.rol || '').toLowerCase();
    return nom.includes(q) || cor.includes(q) || ciVal.includes(q) || telVal.includes(q) || rol.includes(q);
  });

  const handleCambiarRolUsuario = async (usuarioId: number, nuevoRolId: number, nombre: string) => {
    const rolObj = rolesList.find((r) => r.id === nuevoRolId);
    if (!window.confirm(`¿Confirmas la asignación del rol "${rolObj?.nombre || 'Nuevo Rol'}" para ${nombre}?`)) return;
    try {
      await usuariosApi.cambiarRol(usuarioId, nuevoRolId);
      toast.success(`Rol asignado correctamente a ${nombre}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar rol');
    }
  };

  const handleCambiarEstadoUsuario = async (usuarioId: number, activoActual: boolean, nombre: string) => {
    const nuevoEstado = !activoActual;
    const accion = nuevoEstado ? 'habilitar' : 'suspender';
    if (!window.confirm(`¿Confirmas ${accion} el acceso de ${nombre}?`)) return;
    try {
      await usuariosApi.cambiarEstado(usuarioId, nuevoEstado);
      toast.success(`Cuenta de ${nombre} ${nuevoEstado ? 'habilitada' : 'suspendida'}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al modificar estado');
    }
  };

  const handleGestionarSolicitud = async (id: number, accion: 'Aprobar' | 'Rechazar') => {
    if (!window.confirm(`¿Estás seguro de ${accion.toLowerCase()} esta solicitud?`)) return;
    try {
      await axios.put(
        `http://localhost:3000/api/roles/manage/${id}`,
        { accion },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(`Solicitud ${accion.toLowerCase()}da correctamente`);
      onRefresh();
    } catch (error: any) {
      toast.error('Error al gestionar solicitud');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex space-x-2">
          <button
            onClick={() => setSubTabUsuarios('directorio')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              subTabUsuarios === 'directorio'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Directorio de Usuarios ({usuariosList.length})
          </button>
          <button
            onClick={() => setSubTabUsuarios('solicitudes')}
            className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              subTabUsuarios === 'solicitudes'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Solicitudes Pendientes
            {solicitudes.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white">
                {solicitudes.length}
              </span>
            )}
          </button>
        </div>

        {subTabUsuarios === 'directorio' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
            />
          </div>
        )}
      </div>

      {subTabUsuarios === 'directorio' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
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
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron usuarios coincidentes
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
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
                              onChange={(e) => handleCambiarRolUsuario(u.id, Number(e.target.value), u.nombreCompleto)}
                              className="text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-tech-blue"
                              title="Cambiar rol institucional directamente"
                            >
                              {rolesList.map((r) => (
                                <option key={r.id} value={r.id}>
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
                              onClick={() => handleCambiarEstadoUsuario(u.id, u.activo !== false, u.nombreCompleto)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors shadow-sm ${
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
      )}

      {subTabUsuarios === 'solicitudes' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
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
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{sol.usuario.nombreCompleto}</p>
                        <p className="text-xs text-slate-500">{sol.usuario.correo}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">
                          {typeof sol.usuario.rol === 'object' ? sol.usuario.rol?.nombre : sol.usuario.rol || 'Estudiante'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-tech-blue dark:text-blue-400">{sol.rolSolicitado}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={sol.motivo}>
                        {sol.motivo}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleGestionarSolicitud(sol.id, 'Aprobar')}
                          title="Aprobar"
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleGestionarSolicitud(sol.id, 'Rechazar')}
                          title="Rechazar"
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
