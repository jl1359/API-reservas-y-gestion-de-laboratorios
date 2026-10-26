import type { Dispatch, SetStateAction } from 'react';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DiaSchedule } from './ModalHorariosLab';

interface HorariosSemanalesLabFormProps {
  scheduleForm: DiaSchedule[];
  setScheduleForm: Dispatch<SetStateAction<DiaSchedule[]>>;
}

export default function HorariosSemanalesLabForm({
  scheduleForm,
  setScheduleForm
}: HorariosSemanalesLabFormProps) {
  const aplicarEstandarFCyT = () => {
    setScheduleForm(scheduleForm.map(s => ({
      ...s,
      activo: s.dia !== 'Domingo',
      horaApertura: '06:45',
      horaCierre: s.dia === 'Sábado' ? '13:00' : '21:45'
    })));
    toast.success('Horario oficial FCyT cargado');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
          <Clock className="w-4 h-4 mr-1.5 text-tech-blue" />
          Horario Operativo Semanal
        </label>
        <button
          type="button"
          onClick={aplicarEstandarFCyT}
          className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-tech-blue dark:text-blue-400 hover:bg-blue-100 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          Aplicar Estándar FCyT (06:45 - 21:45)
        </button>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Define los días y franjas horarias de funcionamiento para que el laboratorio quede listo y disponible para reservas de inmediato.
      </p>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {scheduleForm.map((diaInfo, idx) => (
          <div
            key={diaInfo.dia}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
              diaInfo.activo
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer min-w-[90px]">
              <input
                type="checkbox"
                checked={diaInfo.activo}
                onChange={(e) => {
                  const nuevo = [...scheduleForm];
                  nuevo[idx].activo = e.target.checked;
                  setScheduleForm(nuevo);
                }}
                className="rounded text-tech-blue"
              />
              <span>{diaInfo.dia}</span>
            </label>

            {diaInfo.activo ? (
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={diaInfo.horaApertura}
                  onChange={(e) => {
                    const nuevo = [...scheduleForm];
                    nuevo[idx].horaApertura = e.target.value;
                    setScheduleForm(nuevo);
                  }}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
                <span className="text-slate-400">a</span>
                <input
                  type="time"
                  value={diaInfo.horaCierre}
                  onChange={(e) => {
                    const nuevo = [...scheduleForm];
                    nuevo[idx].horaCierre = e.target.value;
                    setScheduleForm(nuevo);
                  }}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Cerrado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
