import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import type { Usuario, Rol } from '../../../types';

interface ModalCambiarRolUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  nuevoRol: Rol | null;
  motivoCambioRol: string;
  setMotivoCambioRol: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function ModalCambiarRolUsuario({
  isOpen,
  onClose,
  usuario,
  nuevoRol,
  motivoCambioRol,
  setMotivoCambioRol,
  onSubmit,
  isSubmitting
}: ModalCambiarRolUsuarioProps) {
  if (!isOpen || !usuario || !nuevoRol) return null;

  const rolActualNombre =
    typeof usuario.rol === 'object' ? usuario.rol?.nombre : usuario.rol || 'Estudiante';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-tech-blue" />
            Justificar Asignación de Rol
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-2xl text-xs space-y-1 border border-blue-200 dark:border-blue-900/50">
            <p className="font-bold text-slate-900 dark:text-white">
              {usuario.nombreCompleto}
            </p>
            <p className="text-slate-600 dark:text-slate-300">{usuario.correo}</p>
            <p className="text-[11px] pt-1 text-slate-600 dark:text-slate-300">
              Cambio: <span className="font-semibold">{rolActualNombre}</span> a{' '}
              <span className="font-bold text-tech-blue dark:text-blue-400">{nuevoRol.nombre}</span>
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registra el motivo de esta designación manual. Quedará guardado en Auditoría y en la notificación del usuario.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Justificación de Asignación <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={motivoCambioRol}
              onChange={(e) => setMotivoCambioRol(e.target.value)}
              placeholder="Ej. Designado como responsable de laboratorio por jefatura de carrera, docente invitado semestre II/2026..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-tech-blue hover:bg-blue-600 rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Asignando...' : 'Confirmar Cambio de Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
