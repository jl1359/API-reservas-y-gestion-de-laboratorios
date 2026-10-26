import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Usuario } from '../../../types';

interface ModalSuspenderUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  motivoSuspension: string;
  setMotivoSuspension: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function ModalSuspenderUsuario({
  isOpen,
  onClose,
  usuario,
  motivoSuspension,
  setMotivoSuspension,
  onSubmit,
  isSubmitting
}: ModalSuspenderUsuarioProps) {
  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
            Suspender Cuenta de Usuario
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-2xl text-xs space-y-1 border border-rose-200 dark:border-rose-900/50">
            <p className="font-bold text-rose-900 dark:text-rose-200">
              {usuario.nombreCompleto}
            </p>
            <p className="text-rose-700 dark:text-rose-300">
              {usuario.correo}
            </p>
            <p className="text-slate-500 text-[11px] pt-1">
              Rol actual: {typeof usuario.rol === 'object' ? usuario.rol?.nombre : usuario.rol || 'Estudiante'}
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Indica el motivo de la suspensión para la bitácora de auditoría.
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
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Suspensión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
