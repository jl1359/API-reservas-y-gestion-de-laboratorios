import { useState } from 'react';
import apiClient from '../../api/client';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { usuariosApi } from '../../api/usuarios.api';
import type { Usuario, Rol } from '../../types';
import ModalSuspenderUsuario from './usuarios/ModalSuspenderUsuario';
import ModalRechazarSolicitudRol, { type SolicitudRolItem } from './usuarios/ModalRechazarSolicitudRol';
import TablaDirectorioUsuarios from './usuarios/TablaDirectorioUsuarios';
import TablaSolicitudesRol from './usuarios/TablaSolicitudesRol';

export type { SolicitudRolItem };

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

  const [isSuspenderModalOpen, setIsSuspenderModalOpen] = useState(false);
  const [usuarioASuspender, setUsuarioASuspender] = useState<Usuario | null>(null);
  const [motivoSuspension, setMotivoSuspension] = useState('');
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

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
      await apiClient.put(`/api/roles/manage/${id}`, { accion: 'Aprobar' });
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
      await apiClient.put(`/api/roles/manage/${solicitudARechazar.id}`, {
        accion: 'Rechazar',
        motivoRechazo: motivoRechazoSolicitud.trim()
      });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div className="flex space-x-2">
          <button
            onClick={() => setSubTabUsuarios('directorio')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${
              subTabUsuarios === 'directorio'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Directorio de Usuarios ({usuariosList.length})
          </button>
          <button
            onClick={() => setSubTabUsuarios('solicitudes')}
            className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${
              subTabUsuarios === 'solicitudes'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Solicitudes Pendientes
            {solicitudes.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-semibold">
                {solicitudes.length}
              </span>
            )}
          </button>
        </div>

        {subTabUsuarios === 'directorio' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 outline-none transition-all"
            />
          </div>
        )}
      </div>

      {subTabUsuarios === 'directorio' && (
        <TablaDirectorioUsuarios
          usuarios={usuariosFiltrados}
          rolesList={rolesList}
          isLoading={isLoading}
          onCambiarRol={handleCambiarRolUsuario}
          onAbrirSuspension={handleAbrirSuspension}
          onHabilitarCuenta={handleHabilitarCuenta}
        />
      )}

      {subTabUsuarios === 'solicitudes' && (
        <TablaSolicitudesRol
          solicitudes={solicitudes}
          isLoading={isLoading}
          onAprobar={handleAprobarSolicitud}
          onAbrirRechazar={handleAbrirRechazarSolicitud}
        />
      )}

      {/* Modal Suspender Cuenta con Justificación Obligatoria */}
      <ModalSuspenderUsuario
        isOpen={isSuspenderModalOpen}
        onClose={() => setIsSuspenderModalOpen(false)}
        usuario={usuarioASuspender}
        motivoSuspension={motivoSuspension}
        setMotivoSuspension={setMotivoSuspension}
        onSubmit={handleConfirmarSuspension}
        isSubmitting={isSubmittingSuspension}
      />

      {/* Modal Rechazar Solicitud de Rol con Justificación */}
      <ModalRechazarSolicitudRol
        isOpen={isRechazarSolicitudModalOpen}
        onClose={() => setIsRechazarSolicitudModalOpen(false)}
        solicitud={solicitudARechazar}
        motivoRechazo={motivoRechazoSolicitud}
        setMotivoRechazo={setMotivoRechazoSolicitud}
        onSubmit={handleConfirmarRechazoSolicitud}
        isSubmitting={isSubmittingRechazoSolicitud}
      />
    </div>
  );
}