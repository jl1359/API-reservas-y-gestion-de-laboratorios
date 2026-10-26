import { ShieldCheck, AlertTriangle } from 'lucide-react';

export interface HistorialPase {
  id: number;
  hora: string;
  usuario: string;
  laboratorio: string;
  computadora?: number | null;
  exito: boolean;
  motivo?: string;
}

interface HistorialPasesSesionProps {
  historial: HistorialPase[];
}

export default function HistorialPasesSesion({ historial }: HistorialPasesSesionProps) {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
          <span>Pases Validados Hoy</span>
          <span className="text-xs font-semibold bg-blue-100 text-tech-blue dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
            {historial.length}
          </span>
        </h3>

        {historial.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">Sin registros en esta sesión.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historial.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  item.exito
                    ? 'bg-green-50/60 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-900 dark:text-green-200'
                    : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold truncate max-w-[140px]">{item.usuario}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{item.hora}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {item.laboratorio} {item.computadora ? `(PC #${item.computadora})` : ''}
                </p>
                {!item.exito && item.motivo && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1 truncate">
                    {item.motivo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guia Rapida para el Operador */}
      <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-3xl p-6 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <h4 className="font-bold text-tech-blue dark:text-blue-400 flex items-center">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Criterios de Ingreso
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
          <li>Luz verde: ingreso autorizado.</li>
          <li>Tolerancia máxima de anticipación: 15 minutos.</li>
          <li>Cada código QR es intransferible y de un solo uso.</li>
        </ul>
      </div>
    </div>
  );
}
