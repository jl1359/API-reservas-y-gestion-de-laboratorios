import {
  Calendar as CalendarIcon,
  CalendarDays,
  ListFilter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2
} from 'lucide-react';

export interface ReservaLab {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  motivo?: string;
  materia?: string;
  tipo?: string;
  numeroComputadora?: number | null;
  usuario: { nombreCompleto: string };
}

export interface BloqueEvaluado {
  id: number;
  etiqueta: string;
  inicio: string;
  fin: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'FERIADO' | 'MANTENIMIENTO' | 'FUERA_HORARIO';
  motivoOcupacion: string | null;
  docente?: string;
  estadoReserva?: string;
  dentroDeHorario: boolean;
  reserva?: ReservaLab;
}

interface FeriadoItem {
  id: number;
  fecha: string;
  motivo: string;
}

interface MantenimientoItem {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
}

interface LabDetailCalendarProps {
  reservas: ReservaLab[];
  vistaAgenda: 'bloques' | 'lista';
  setVistaAgenda: (vista: 'bloques' | 'lista') => void;
  fechaSeleccionada: string;
  setFechaSeleccionada: (fecha: string) => void;
  hoyStr: string;
  diaSemanaNombre: string;
  diaSel: number;
  mesSel: number;
  añoSel: number;
  totalDisponibles: number;
  totalOcupados: number;
  feriadoDelDia?: FeriadoItem;
  mantenimientoDelDia?: MantenimientoItem;
  laboratorioOperaHoy: boolean;
  bloquesEvaluados: BloqueEvaluado[];
  onCambiarDia: (delta: number) => void;
  onAbrirReservaBloque: (inicio: string, fin: string) => void;
}

export default function LabDetailCalendar({
  reservas,
  vistaAgenda,
  setVistaAgenda,
  fechaSeleccionada,
  setFechaSeleccionada,
  hoyStr,
  diaSemanaNombre,
  diaSel,
  mesSel,
  añoSel,
  totalDisponibles,
  totalOcupados,
  feriadoDelDia,
  mantenimientoDelDia,
  laboratorioOperaHoy,
  bloquesEvaluados,
  onCambiarDia,
  onAbrirReservaBloque
}: LabDetailCalendarProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800/80 transition-all">
        {/* Encabezado y Alternancia de Vistas */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-tech-blue" />
              Calendario de Disponibilidad
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Consulta los bloques horarios libres y ocupados en tiempo real.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Tiempo Real
            </span>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex space-x-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setVistaAgenda('bloques')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center cursor-pointer ${
                  vistaAgenda === 'bloques'
                    ? 'bg-white dark:bg-slate-700 text-tech-blue dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 mr-1" />
                Bloques
              </button>
              <button
                type="button"
                onClick={() => setVistaAgenda('lista')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center cursor-pointer ${
                  vistaAgenda === 'lista'
                    ? 'bg-white dark:bg-slate-700 text-tech-blue dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 mr-1" />
                Sesiones ({reservas.length})
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Navegación de Fechas (Día Anterior, Selector y Día Siguiente) */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-4 mb-6 border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onCambiarDia(-1)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-tech-blue cursor-pointer"
              />

              <button
                type="button"
                onClick={() => onCambiarDia(1)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setFechaSeleccionada(hoyStr)}
                className="px-3 py-2 text-xs font-bold text-tech-blue hover:bg-blue-500/10 rounded-xl transition cursor-pointer"
              >
                Hoy
              </button>
            </div>

            {/* Resumen del Día Seleccionado */}
            <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide mr-2">
                {diaSemanaNombre}, {diaSel}/{mesSel}/{añoSel}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {totalDisponibles} Libres
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {totalOcupados} Ocupados
              </span>
            </div>
          </div>

          {/* Banner de Advertencia si es Feriado */}
          {feriadoDelDia && (
            <div className="mt-3.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center space-x-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                <strong>Feriado Institucional:</strong> {feriadoDelDia.motivo}. El campus permanece cerrado.
              </span>
            </div>
          )}

          {/* Banner de Advertencia si está en Mantenimiento */}
          {mantenimientoDelDia && (
            <div className="mt-3.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center space-x-2 text-xs text-amber-700 dark:text-amber-300">
              <Wrench className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                <strong>Mantenimiento Técnico:</strong> {mantenimientoDelDia.motivo}. Actividades suspendidas.
              </span>
            </div>
          )}

          {/* Banner de Advertencia si el Laboratorio no atiende este día */}
          {!feriadoDelDia && !mantenimientoDelDia && !laboratorioOperaHoy && (
            <div className="mt-3.5 p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400">
              Este laboratorio no atiende los días <strong>{diaSemanaNombre}</strong>.
            </div>
          )}
        </div>

        {/* VISTA 1: MATRIZ DE BLOQUES ACADÉMICOS EN TIEMPO REAL */}
        {vistaAgenda === 'bloques' && (
          <div className="space-y-3">
            {bloquesEvaluados.map((bloque) => {
              const isDisponible = bloque.estado === 'DISPONIBLE';
              const isOcupado = bloque.estado === 'OCUPADO';
              const isFeriado = bloque.estado === 'FERIADO';
              const isMantenimiento = bloque.estado === 'MANTENIMIENTO';

              return (
                <div
                  key={bloque.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                    isDisponible
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30 hover:border-emerald-500/50'
                      : isOcupado
                      ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 dark:border-rose-500/30'
                      : isMantenimiento || isFeriado
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30'
                      : 'bg-slate-500/5 dark:bg-slate-500/10 border-slate-500/20 opacity-60'
                  }`}
                >
                  {/* Bloque y Rango Horario */}
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className={`p-2.5 rounded-xl ${
                      isDisponible
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isOcupado
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : isMantenimiento || isFeriado
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {isMantenimiento ? <Wrench className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {bloque.etiqueta}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {bloque.inicio} - {bloque.fin}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isDisponible && 'Espacio disponible para reserva académica'}
                        {isOcupado && `${bloque.motivoOcupacion} · Docente: ${bloque.docente}`}
                        {!isDisponible && !isOcupado && bloque.motivoOcupacion}
                      </p>
                    </div>
                  </div>

                  {/* Estado y Acción */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                    {isDisponible && (
                      <button
                        type="button"
                        onClick={() => onAbrirReservaBloque(bloque.inicio, bloque.fin)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Reservar Bloque
                      </button>
                    )}

                    {isOcupado && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Ocupado ({bloque.estadoReserva})
                      </span>
                    )}

                    {isMantenimiento && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center">
                        <Wrench className="w-3 h-3 mr-1" /> Mantenimiento
                      </span>
                    )}

                    {isFeriado && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Feriado
                      </span>
                    )}

                    {!isDisponible && !isOcupado && !isMantenimiento && !isFeriado && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-500">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VISTA 2: LISTA CRONOLÓGICA DE PRÓXIMAS SESIONES */}
        {vistaAgenda === 'lista' && (
          <>
            {reservas.length > 0 ? (
              <div className="space-y-4">
                {reservas.map((reserva) => {
                  const start = new Date(reserva.fechaInicio);
                  const end = new Date(reserva.fechaFin);
                  return (
                    <div
                      key={reserva.id}
                      className="flex flex-col md:flex-row md:items-center bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Fecha Badge */}
                      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-2 text-center w-20 shadow-xs">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {start.toLocaleString('es-ES', { month: 'short' })}
                        </p>
                        <p className="text-xl font-extrabold text-umss-blue dark:text-blue-400 leading-none mt-0.5">
                          {start.getDate()}
                        </p>
                      </div>

                      {/* Info Reserva */}
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {reserva.materia || reserva.motivo || 'Sesión de Laboratorio'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Reservado por: <span className="font-medium text-slate-700 dark:text-slate-300">{reserva.usuario.nombreCompleto}</span>
                        </p>
                      </div>

                      {/* Horario */}
                      <div className="flex-shrink-0 text-right md:border-l border-slate-200/60 dark:border-slate-700/60 md:pl-4">
                        <div className="flex items-center justify-end text-slate-700 dark:text-slate-300 font-semibold text-xs">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-tech-blue" />
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span
                          className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            reserva.estado === 'Aprobada'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {reserva.estado}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No hay reservas registradas en el sistema para este laboratorio.
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Todos los turnos operativos se encuentran disponibles.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}