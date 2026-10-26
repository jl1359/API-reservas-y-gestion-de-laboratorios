import {
  Clock,
  RefreshCw,
  Building2,
  Search,
  CheckCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export interface ReservaTurno {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  materia?: string | null;
  motivo?: string | null;
  numeroComputadora?: number | null;
  horaAsistencia?: string | null;
  usuario?: {
    id: number;
    nombreCompleto: string;
    ci?: string | null;
    correo: string;
    telefono?: string | null;
    rol?: { nombre: string };
  };
  laboratorio?: {
    id: number;
    nombre: string;
    ubicacion?: string;
    reservaPorComputadora?: boolean;
  };
}

interface TablaReservasTurnoActualProps {
  reservasTurno: ReservaTurno[];
  cargandoTurno: boolean;
  filtroLab: number | 'todos';
  setFiltroLab: (val: number | 'todos') => void;
  busquedaTurno: string;
  setBusquedaTurno: (val: string) => void;
  laboratorios: { id: number; nombre: string }[];
  marcandoId: number | null;
  onRecargar: () => void;
  onMarcarAsistenciaDirecta: (reserva: ReservaTurno) => void;
}

export default function TablaReservasTurnoActual({
  reservasTurno,
  cargandoTurno,
  filtroLab,
  setFiltroLab,
  busquedaTurno,
  setBusquedaTurno,
  laboratorios,
  marcandoId,
  onRecargar,
  onMarcarAsistenciaDirecta
}: TablaReservasTurnoActualProps) {
  const filtradas = reservasTurno.filter((r) => {
    if (filtroLab !== 'todos' && r.laboratorio?.id !== filtroLab) return false;
    if (!busquedaTurno.trim()) return true;
    const q = busquedaTurno.toLowerCase();
    const nombre = r.usuario?.nombreCompleto?.toLowerCase() || '';
    const ci = r.usuario?.ci?.toLowerCase() || '';
    const materia = r.materia?.toLowerCase() || '';
    const idStr = String(r.id);
    return nombre.includes(q) || ci.includes(q) || materia.includes(q) || idStr.includes(q);
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
            <Clock className="w-4 h-4 mr-2 text-tech-blue" />
            Reservas de Hoy / Turno Actual
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Check-in directo del turno actual.
          </p>
        </div>

        <button
          onClick={onRecargar}
          disabled={cargandoTurno}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-tech-blue dark:hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          title="Refrescar lista de reservas"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargandoTurno ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filtros de la lista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        <div className="relative">
          <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filtroLab}
            onChange={(e) => setFiltroLab(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none cursor-pointer"
          >
            <option value="todos">Todos los Laboratorios</option>
            {laboratorios.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.nombre}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={busquedaTurno}
            onChange={(e) => setBusquedaTurno(e.target.value)}
            placeholder="Filtrar por estudiante, CI o materia..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
          />
        </div>
      </div>

      {/* Listado de tarjetas de reserva */}
      {cargandoTurno ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-tech-blue" />
          <p className="text-xs">Cargando reservas de la jornada...</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          <p className="text-xs font-medium">No se encontraron reservas programadas para hoy con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filtradas.map((r) => {
            const horaInicioStr = new Date(r.fechaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const horaFinStr = new Date(r.fechaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={r.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {r.usuario?.nombreCompleto}
                    </span>
                    {r.usuario?.ci && (
                      <span className="font-mono text-[11px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                        CI: {r.usuario.ci}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">#{r.id}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <span className="font-semibold text-tech-blue dark:text-blue-400">
                      {r.laboratorio?.nombre}
                      {r.numeroComputadora ? ` (PC #${r.numeroComputadora})` : ' (Aula Completa)'}
                    </span>
                    <span>{horaInicioStr} - {horaFinStr}</span>
                    {r.materia && <span className="italic truncate max-w-[150px]">{r.materia}</span>}
                  </div>
                </div>

                <div className="flex items-center self-end sm:self-auto shrink-0">
                  {r.estado === 'Aprobada' ? (
                    <button
                      onClick={() => onMarcarAsistenciaDirecta(r)}
                      disabled={marcandoId === r.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      {marcandoId === r.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Marcando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Marcar Asistencia</span>
                        </>
                      )}
                    </button>
                  ) : r.estado === 'Asistió' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                      Asistió {r.horaAsistencia ? new Date(r.horaAsistencia).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      <XCircle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" />
                      Inasistencia
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
