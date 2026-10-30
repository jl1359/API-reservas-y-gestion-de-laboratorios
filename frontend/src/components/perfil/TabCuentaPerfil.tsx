import React from 'react';
import PushNotificationToggle from '../PushNotificationToggle';
import {
  User,
  Shield,
  Key,
  Send,
  AlertTriangle,
  Calendar,
  Clock,
  Phone,
  Mail,
  Save
} from 'lucide-react';

interface TabCuentaPerfilProps {
  usuario: any;
  nombreRol: string;
  perfilNombre: string;
  setPerfilNombre: (val: string) => void;
  perfilTelefono: string;
  setPerfilTelefono: (val: string) => void;
  perfilCi: string;
  setPerfilCi: (val: string) => void;
  perfilCarreraId: string;
  setPerfilCarreraId: (val: string) => void;
  carreras: any[];
  isGuardandoPerfil: boolean;
  onGuardarPerfil: (e: React.FormEvent) => void;
  roles: any[];
  rolSeleccionado: string;
  setRolSeleccionado: (val: string) => void;
  motivo: string;
  setMotivo: (val: string) => void;
  isSubmittingSolicitud: boolean;
  onSolicitarRol: (e: React.FormEvent) => void;
  misReservas: any[];
  onAbrirPasswordModal: () => void;
  onEliminarCuenta: () => void;
}

export default function TabCuentaPerfil({
  usuario,
  nombreRol,
  perfilNombre,
  setPerfilNombre,
  perfilTelefono,
  setPerfilTelefono,
  perfilCi,
  setPerfilCi,
  perfilCarreraId,
  setPerfilCarreraId,
  carreras,
  isGuardandoPerfil,
  onGuardarPerfil,
  roles,
  rolSeleccionado,
  setRolSeleccionado,
  motivo,
  setMotivo,
  isSubmittingSolicitud,
  onSolicitarRol,
  misReservas,
  onAbrirPasswordModal,
  onEliminarCuenta
}: TabCuentaPerfilProps) {
  return (
    <div className="space-y-6">
      {/* Informacion de Perfil Complementaria */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2 flex items-center">
          <User className="w-5 h-5 mr-2 text-tech-blue" /> Información Personal
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Datos personales y de contacto.
        </p>
        <form onSubmit={onGuardarPerfil} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                value={perfilNombre}
                onChange={(e) => setPerfilNombre(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> Teléfono de Contacto
              </label>
              <input
                type="text"
                value={perfilTelefono}
                onChange={(e) => setPerfilTelefono(e.target.value)}
                placeholder="+591 71234567"
                className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Cédula de Identidad (CI)
              </label>
              <input
                type="text"
                value={perfilCi}
                onChange={(e) => setPerfilCi(e.target.value)}
                placeholder="Ej. 8472912"
                className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> Correo electronico
              </label>
              <p className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-950/40 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                {usuario?.correo || 'Cargando...'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Carrera Académica
              </label>
              <select
                value={perfilCarreraId}
                onChange={(e) => setPerfilCarreraId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition-all"
              >
                <option value="">Facultad de Ciencias y Tecnología</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isGuardandoPerfil}
              className="inline-flex items-center bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              <span>{isGuardandoPerfil ? 'Guardando...' : 'Guardar Datos'}</span>
            </button>
          </div>
        </form>
      </div>

      {nombreRol === 'Estudiante' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
          <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-tech-blue" /> Solicitar Permisos
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Solicitud de cambio de rol al Administrador.
          </p>
          <form onSubmit={onSolicitarRol}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Rol Solicitado
              </label>
              <select
                value={rolSeleccionado}
                onChange={(e) => setRolSeleccionado(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 outline-none transition-all"
              >
                {roles.map((r: any) => (
                  <option key={r.id} value={r.nombre}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Justifica por qué necesitas este rol..."
              className="w-full px-4 py-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none mb-4 resize-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition-all"
            ></textarea>
            <button
              type="submit"
              disabled={isSubmittingSolicitud}
              className="inline-flex items-center bg-tech-blue hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              <Send className="w-4 h-4 mr-2" /> {isSubmittingSolicitud ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </div>
      )}

      {/* Seccion Mis Reservas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-tech-blue" /> Mis Reservas de Laboratorio
        </h3>

        {misReservas.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
            <p className="text-sm font-medium">No tienes reservas registradas actualmente.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Puedes realizar una reserva desde la página de detalle de cualquier laboratorio.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {misReservas.map((res: any) => {
              const start = new Date(res.fechaInicio);
              const end = new Date(res.fechaFin);
              const estadoEstilo =
                res.estado === 'Aprobada'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : res.estado === 'Pendiente'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

              return (
                <div key={res.id} className="p-4 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{res.laboratorio?.nombre || 'Laboratorio'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Materia: <strong className="text-slate-700 dark:text-slate-300">{res.materia || 'Práctica'}</strong> • {res.cantidadAlumnos || 1} alumnos
                    </p>
                    <p className="text-xs text-slate-400 flex items-center mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                      {start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}, {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {res.motivo && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Nota: {res.motivo}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${estadoEstilo}`}>
                      {res.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notificaciones en Dispositivo (Celular / Desktop) */}
      <PushNotificationToggle variant="card" />

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2 flex items-center">
          <Key className="w-5 h-5 mr-2 text-tech-blue" /> Seguridad
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Actualiza tu contraseña periódicamente para mantener tu cuenta segura.
        </p>
        <button
          onClick={onAbrirPasswordModal}
          className="inline-flex items-center space-x-2 bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Key className="w-4 h-4" />
          <span>Cambiar Contraseña</span>
        </button>
      </div>

      <div className="bg-rose-500/5 dark:bg-rose-950/20 rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-500/20 dark:border-rose-900/40">
        <h3 className="text-xl font-heading font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" /> Zona de Peligro
        </h3>
        <p className="text-rose-600 dark:text-rose-400/90 text-sm mb-6">
          Acción irreversible. Se eliminarán tu cuenta y reservas asociadas.
        </p>
        <button
          onClick={onEliminarCuenta}
          className="inline-flex items-center bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm shadow-rose-600/20 transition-all"
        >
          Eliminar mi cuenta
        </button>
      </div>
    </div>
  );
}