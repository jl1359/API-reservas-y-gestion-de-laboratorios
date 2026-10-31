import { Clock, X, RotateCcw } from 'lucide-react';

export interface DiaSchedule {
  dia: string;
  activo: boolean;
  horaApertura: string;
  horaCierre: string;
}

export const defaultSchedule: DiaSchedule[] = [
  { dia: 'Lunes', activo: true, horaApertura: '06:45', horaCierre: '21:45' },
  { dia: 'Martes', activo: true, horaApertura: '06:45', horaCierre: '21:45' },
  { dia: 'Miércoles', activo: true, horaApertura: '06:45', horaCierre: '21:45' },
  { dia: 'Jueves', activo: true, horaApertura: '06:45', horaCierre: '21:45' },
  { dia: 'Viernes', activo: true, horaApertura: '06:45', horaCierre: '21:45' },
  { dia: 'Sábado', activo: true, horaApertura: '06:45', horaCierre: '12:45' },
  { dia: 'Domingo', activo: false, horaApertura: '08:00', horaCierre: '13:00' }
];

export const formatIsoToTimeStr = (isoString?: string | Date): string => {
  if (!isoString) return '06:45';
  if (typeof isoString === 'string' && /^\d{2}:\d{2}$/.test(isoString)) {
    return isoString;
  }
  try {
    const d = new Date(isoString);
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '06:45';
  }
};

const normalizarDia = (texto: string) =>
  (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const mapearHorariosApiASchedule = (
  horariosApi: any[],
  baseSchedule: DiaSchedule[]
): DiaSchedule[] => {
  if (!Array.isArray(horariosApi) || horariosApi.length === 0) {
    return baseSchedule.map((d) => ({ ...d }));
  }
  return baseSchedule.map((defDia) => {
    const match = horariosApi.find(
      (h: any) => h.dia && normalizarDia(h.dia) === normalizarDia(defDia.dia)
    );
    if (match) {
      return {
        dia: defDia.dia,
        activo: true,
        horaApertura: formatIsoToTimeStr(match.horaApertura),
        horaCierre: formatIsoToTimeStr(match.horaCierre)
      };
    }
    return {
      ...defDia,
      activo: false
    };
  });
};

interface ModalHorariosLabProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLabName: string;
  scheduleForm: DiaSchedule[];
  onToggleDay: (index: number) => void;
  onChangeTime: (index: number, field: 'horaApertura' | 'horaCierre', value: string) => void;
  onSaveSchedule: () => void;
  onResetToUmss?: () => void;
}

export default function ModalHorariosLab({
  isOpen,
  onClose,
  selectedLabName,
  scheduleForm,
  onToggleDay,
  onChangeTime,
  onSaveSchedule,
  onResetToUmss
}: ModalHorariosLabProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-tech-blue" /> Horarios de Apertura
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-750">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Franjas horarias y días de operación académica.
            </p>
            {onResetToUmss && (
              <button
                type="button"
                onClick={onResetToUmss}
                className="inline-flex items-center text-xs font-semibold text-tech-blue hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer"
                title="Cargar Lunes a Viernes 06:45-21:45 y Sábado 06:45-12:45"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                <span>Horario Oficial UMSS</span>
              </button>
            )}
          </div>

          {scheduleForm.map((diaInfo, index) => (
            <div
              key={diaInfo.dia}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-colors ${
                diaInfo.activo
                  ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-900/10'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                <input
                  type="checkbox"
                  checked={diaInfo.activo}
                  onChange={() => onToggleDay(index)}
                  className="w-5 h-5 text-tech-blue rounded focus:ring-tech-blue cursor-pointer"
                />
                <span className={`font-bold text-sm ${diaInfo.activo ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {diaInfo.dia}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  disabled={!diaInfo.activo}
                  value={diaInfo.horaApertura}
                  onChange={(e) => onChangeTime(index, 'horaApertura', e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-tech-blue"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="time"
                  disabled={!diaInfo.activo}
                  value={diaInfo.horaCierre}
                  onChange={(e) => onChangeTime(index, 'horaCierre', e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-tech-blue"
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
            className="px-6 py-2.5 rounded-xl font-bold bg-tech-blue hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-colors"
          >
            Guardar Horarios
          </button>
        </div>
      </div>
    </div>
  );
}
