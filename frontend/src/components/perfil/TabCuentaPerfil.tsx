import React from 'react';
import PushNotificationToggle from '../PushNotificationToggle';
import {
  User,
  Shield,
  Key,
  Send,
  AlertTriangle,
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
              className="inline-flex items-center bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
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
              className="inline-flex items-center bg-tech-blue hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 mr-2" /> {isSubmittingSolicitud ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </div>
      )}

      {/* Notificaciones en Dispositivo (Celular / Desktop) */}
      <PushNotificationToggle variant="card" />

      {/* Seguridad de la Cuenta */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2 flex items-center">
          <Key className="w-5 h-5 mr-2 text-tech-blue" /> Seguridad
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Actualiza tu contraseña periódicamente para mantener tu cuenta segura.
        </p>
        <button
          onClick={onAbrirPasswordModal}
          className="inline-flex items-center space-x-2 bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Key className="w-4 h-4" />
          <span>Cambiar Contraseña</span>
        </button>
      </div>

      {/* Zona de Peligro */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-500/20 dark:border-rose-900/40">
        <h3 className="text-xl font-heading font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" /> Zona de Peligro
        </h3>
        <p className="text-rose-600 dark:text-rose-400/90 text-sm mb-6">
          Acción irreversible. Se eliminarán tu cuenta y reservas asociadas.
        </p>
        <button
          onClick={onEliminarCuenta}
          className="inline-flex items-center bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
        >
          Eliminar mi cuenta
        </button>
      </div>
    </div>
  );
}
