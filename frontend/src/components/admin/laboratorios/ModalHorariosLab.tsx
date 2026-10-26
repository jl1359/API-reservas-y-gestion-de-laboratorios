import { Clock, X } from 'lucide-react';

export interface DiaSchedule {
  dia: string;
  activo: boolean;
  horaApertura: string;
  horaCierre: string;
}

interface ModalHorariosLabProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLabName: string;
  scheduleForm: DiaSchedule[];
  onToggleDay: (index: number) => void;
  onChangeTime: (index: number, field: 'horaApertura' | 'horaCierre', value: string) => void;
  onSaveSchedule: () => void;
}

export default function ModalHorariosLab({
  isOpen,
  onClose,
  selectedLabName,
  scheduleForm,
  onToggleDay,
  onChangeTime,
  onSaveSchedule
}: ModalHorariosLabProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Horarios de Apertura
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Laboratorio: {selectedLabName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Activa los días que el laboratorio estará abierto y define su franja horaria.
          </p>
          {scheduleForm.map((diaInfo, index) => (
            <div
              key={diaInfo.dia}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${
                diaInfo.activo
                  ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                <input
                  type="checkbox"
                  checked={diaInfo.activo}
                  onChange={() => onToggleDay(index)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className={`font-bold ${diaInfo.activo ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>
                  {diaInfo.dia}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  disabled={!diaInfo.activo}
                  value={diaInfo.horaApertura}
                  onChange={(e) => onChangeTime(index, 'horaApertura', e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="time"
                  disabled={!diaInfo.activo}
                  value={diaInfo.horaCierre}
                  onChange={(e) => onChangeTime(index, 'horaCierre', e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSaveSchedule}
            className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
          >
            Guardar Horarios
          </button>
        </div>
      </div>
    </div>
  );
}