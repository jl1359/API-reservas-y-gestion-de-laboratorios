import React from 'react';
import { XCircle, X } from 'lucide-react';

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

interface ModalRechazarSolicitudRolProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: SolicitudRolItem | null;
  motivoRechazo: string;
  setMotivoRechazo: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function ModalRechazarSolicitudRol({
  isOpen,
  onClose,
  solicitud,
  motivoRechazo,
  setMotivoRechazo,
  onSubmit,
  isSubmitting
}: ModalRechazarSolicitudRolProps) {
  if (!isOpen || !solicitud) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-rose-500" />
            Rechazar Solicitud de Rol
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-xs space-y-1 border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {solicitud.usuario.nombreCompleto} ({solicitud.usuario.correo})
            </p>
            <p className="text-tech-blue dark:text-blue-400 font-semibold">
              Rol solicitado: {solicitud.rolSolicitado}
            </p>
            <p className="text-slate-500 italic text-[11px]">
              Justificación del postulante: "{solicitud.motivo}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo Académico de Rechazo <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej. Carga horaria no coincide con el periodo académico, documentación incompleta..."
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
              {isSubmitting ? 'Rechazando...' : 'Confirmar Rechazo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}