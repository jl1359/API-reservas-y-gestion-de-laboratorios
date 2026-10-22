import { useState } from 'react';
import axios from 'axios';
import { Search, Phone, CheckCircle, XCircle, Users, ShieldCheck, X, AlertTriangle } from 'lucide-react';
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

  // Modal de Suspensión de Cuenta con Justificación
  const [isSuspenderModalOpen, setIsSuspenderModalOpen] = useState(false);
  const [usuarioASuspender, setUsuarioASuspender] = useState<Usuario | null>(null);
  const [motivoSuspension, setMotivoSuspension] = useState('');
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // Modal de Rechazo de Solicitud de Rol con Justificación
  const [isRechazarSolicitudModalOpen, setIsRechazarSolicitudModalOpen] = useState(false);
  const [solicitudARechazar, setSolicitudARechazar] = useState<SolicitudRolItem | null>(null);
  const [motivoRechazoSolicitud, setMotivoRechazoSolicitud] = useState('');
  const [isSubmittingRechazoSolicitud, setIsSubmittingRechazoSolicitud] = useState(false);

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

  const handleAbrirSuspension = (usuario: Usuario) => {
    setUsuarioASuspender(usuario);
    setMotivoSuspension('');
    setIsSuspenderModalOpen(true);
  };

  const handleConfirmarSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioASuspender) return;
    if (motivoSuspension.trim().length < 5) {
      return toast.error('Ingresa una justificación formal de al menos 5 caracteres');
    }
    setIsSubmittingSuspension(true);
    try {
      await usuariosApi.cambiarEstado(usuarioASuspender.id, false, motivoSuspension.trim());
      toast.success(`Cuenta de ${usuarioASuspender.nombreCompleto} suspendida y notificada exitosamente`);
      setIsSuspenderModalOpen(false);
      setUsuarioASuspender(null);
      setMotivoSuspension('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al suspender cuenta');
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  const handleHabilitarCuenta = async (usuario: Usuario) => {
    if (!window.confirm(`¿Confirmas reactivar y habilitar nuevamente el acceso de ${usuario.nombreCompleto}?`)) return;
    try {
      await usuariosApi.cambiarEstado(usuario.id, true);
      toast.success(`Cuenta de ${usuario.nombreCompleto} habilitada nuevamente`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al habilitar cuenta');
    }
  };

  const handleAprobarSolicitud = async (id: number, nombre: string, rol: string) => {
    if (!window.confirm(`¿Confirmas aprobar la promoción de rol a "${rol}" para ${nombre}?`)) return;
    try {
      await axios.put(
        `http://localhost:3000/api/roles/manage/${id}`,
        { accion: 'Aprobar' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(`Solicitud aprobada y rol "${rol}" asignado a ${nombre}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al aprobar solicitud');
    }
  };

  const handleAbrirRechazarSolicitud = (solicitud: SolicitudRolItem) => {
    setSolicitudARechazar(solicitud);
    setMotivoRechazoSolicitud('');
    setIsRechazarSolicitudModalOpen(true);
  };

  const handleConfirmarRechazoSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudARechazar) return;
    if (motivoRechazoSolicitud.trim().length < 5) {
      return toast.error('Ingresa una justificación formal de al menos 5 caracteres');
    }
    setIsSubmittingRechazoSolicitud(true);
    try {
      await axios.put(
        `http://localhost:3000/api/roles/manage/${solicitudARechazar.id}`,
        { accion: 'Rechazar', motivoRechazo: motivoRechazoSolicitud.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Solicitud rechazada con registro formal de motivo');
      setIsRechazarSolicitudModalOpen(false);
      setSolicitudARechazar(null);
      setMotivoRechazoSolicitud('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al rechazar solicitud');
    } finally {
      setIsSubmittingRechazoSolicitud(false);
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
                              onClick={() => {
                                if (u.activo !== false) {
                                  handleAbrirSuspension(u);
                                } else {
                                  handleHabilitarCuenta(u);
                                }
                              }}
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
                          onClick={() => handleAprobarSolicitud(sol.id, sol.usuario.nombreCompleto, sol.rolSolicitado)}
                          title="Aprobar"
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAbrirRechazarSolicitud(sol)}
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
      {/* Modal Suspender Cuenta con Justificación Obligatoria */}
      {isSuspenderModalOpen && usuarioASuspender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                Suspender Cuenta de Usuario
              </h2>
              <button
                onClick={() => setIsSuspenderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarSuspension} className="mt-4 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-2xl text-xs space-y-1 border border-rose-200 dark:border-rose-900/50">
                <p className="font-bold text-rose-900 dark:text-rose-200">
                  {usuarioASuspender.nombreCompleto}
                </p>
                <p className="text-rose-700 dark:text-rose-300">
                  {usuarioASuspender.correo}
                </p>
                <p className="text-slate-500 text-[11px] pt-1">
                  Rol actual: {typeof usuarioASuspender.rol === 'object' ? usuarioASuspender.rol?.nombre : usuarioASuspender.rol || 'Estudiante'}
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Por política y normativa disciplinaria institucional de la FCyT, es obligatorio fundamentar el motivo de la suspensión. El usuario recibirá una notificación formal y la causa quedará asentada en la bitácora de auditoría.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo o Causal de Suspensión <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoSuspension}
                  onChange={(e) => setMotivoSuspension(e.target.value)}
                  placeholder="Ej. Incumplimiento reiterado de normas del laboratorio, uso indebido de equipamiento, conducta impropia..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSuspenderModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSuspension}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmittingSuspension ? 'Procesando...' : 'Confirmar Suspensión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rechazar Solicitud de Rol con Justificación */}
      {isRechazarSolicitudModalOpen && solicitudARechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-rose-500" />
                Rechazar Solicitud de Rol
              </h2>
              <button
                onClick={() => setIsRechazarSolicitudModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRechazoSolicitud} className="mt-4 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-xs space-y-1 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {solicitudARechazar.usuario.nombreCompleto} ({solicitudARechazar.usuario.correo})
                </p>
                <p className="text-tech-blue dark:text-blue-400 font-semibold">
                  Rol solicitado: {solicitudARechazar.rolSolicitado}
                </p>
                <p className="text-slate-500 italic text-[11px]">
                  Justificación del postulante: "{solicitudARechazar.motivo}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo Académico de Rechazo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoRechazoSolicitud}
                  onChange={(e) => setMotivoRechazoSolicitud(e.target.value)}
                  placeholder="Ej. Carga horaria no coincide con el periodo académico, documentación incompleta..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRechazarSolicitudModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRechazoSolicitud}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmittingRechazoSolicitud ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
