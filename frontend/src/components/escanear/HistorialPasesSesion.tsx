import { useState, useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Search, Clock } from 'lucide-react';

export interface HistorialPase {
  id: number;
  hora: string;
  usuario: string;
  ci?: string | null;
  laboratorio: string;
  computadora?: number | null;
  exito: boolean;
  motivo?: string;
  fechaCompleta?: string;
}

interface HistorialPasesSesionProps {
  historial: HistorialPase[];
}

export default function HistorialPasesSesion({ historial }: HistorialPasesSesionProps) {
  const [busqueda, setBusqueda] = useState('');

  // Filtrado reactivo de los pases validados de hoy
  const pasesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return historial;
    const q = busqueda.toLowerCase().trim();
    return historial.filter(
      (item) =>
        item.usuario.toLowerCase().includes(q) ||
        item.laboratorio.toLowerCase().includes(q) ||
        (item.ci && item.ci.includes(q)) ||
        String(item.id).includes(q)
    );
  }, [historial, busqueda]);

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Encabezado del Panel */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-tech-blue dark:text-blue-400" />
            <span>Pases Validados Hoy</span>
          </h3>
          <span className="text-xs font-bold bg-blue-100 text-tech-blue dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
            {historial.length}
          </span>
        </div>

        {/* Buscador Rápido para la jornada */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, CI, lab o #..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-tech-blue"
          />
        </div>

        {/* Lista de Pases de Hoy */}
        {pasesFiltrados.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">
              {busqueda ? 'No se encontraron coincidencias.' : 'Sin pases registrados hoy.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {pasesFiltrados.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  item.exito
                    ? 'bg-green-50/70 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-900 dark:text-green-200'
                    : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold truncate block">{item.usuario}</span>
                    {item.ci && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        CI: {item.ci}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 block">
                      {item.hora}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-tech-blue dark:text-blue-400 block">
                      #{item.id}
                    </span>
                  </div>
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

      {/* Guía Rápida para el Operador */}
      <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-3xl p-5 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
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
