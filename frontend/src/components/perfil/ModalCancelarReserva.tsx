import React from 'react';
import { XCircle, X } from 'lucide-react';

interface Reserva {
  id: number;
  laboratorio: {
    nombre: string;
  };
  fechaInicio: string;
}

interface ModalCancelarReservaProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  motivoCancelacion: string;
  setMotivoCancelacion: (motivo: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function ModalCancelarReserva({
  isOpen,
  onClose,
  reserva,
  motivoCancelacion,
  setMotivoCancelacion,
  onSubmit,
  isSubmitting
}: ModalCancelarReservaProps) {
  if (!isOpen || !reserva) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-y-auto my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-rose-500" />
            Cancelar Reserva
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="bg-slate-50/80 dark:bg-slate-950/50 p-3.5 rounded-2xl text-xs space-y-1 border border-slate-200 dark:border-slate-800">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {reserva.laboratorio?.nombre}
            </p>
            <p className="text-slate-500">
              {new Date(reserva.fechaInicio).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Indica el motivo de cancelación para liberar el turno a otros estudiantes.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo de Cancelación <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Ej. Cruce imprevisto de horario académico, reprogramación de práctica, etc."
              className="w-full px-3 py-2 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl disabled:opacity-50 transition-all shadow-sm shadow-rose-600/20"
            >
              {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}