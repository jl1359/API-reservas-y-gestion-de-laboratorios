import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Monitor, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import TimePickerInput from './common/TimePickerInput';
import {
  calcularHoraFinSugerida,
  timeToMinutes,
  minutesToTime,
  esDiaSabado
} from '../utils/horariosAcademicos';

interface ReservaExistenteItem {
  fechaInicio: string;
  fechaFin: string;
  numeroComputadora?: number | null;
  estado: string;
}

interface ReservaComputadoraModalProps {
  abierto: boolean;
  laboratorioId: number;
  laboratorioNombre: string;
  cantidadComputadoras: number;
  reservasExistentes?: ReservaExistenteItem[];
  initialFecha?: string;
  initialHoraInicio?: string;
  initialHoraFin?: string;
  onCerrar: () => void;
  onReservaCreada: () => void;
}

interface ReservaForm {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  numeroComputadora: string;
  motivo: string;
}

const FORMULARIO_INICIAL: ReservaForm = {
  fecha: new Date().toISOString().split('T')[0],
  horaInicio: '08:15',
  horaFin: '09:45',
  numeroComputadora: '',
  motivo: '',
};

export default function ReservaComputadoraModal({
  abierto,
  laboratorioId,
  laboratorioNombre,
  cantidadComputadoras,
  reservasExistentes,
  initialFecha,
  initialHoraInicio,
  initialHoraFin,
  onCerrar,
  onReservaCreada,
}: ReservaComputadoraModalProps) {
  const [formulario, setFormulario] = useState<ReservaForm>(FORMULARIO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [listaReservas, setListaReservas] = useState<ReservaExistenteItem[]>(reservasExistentes || []);

  useEffect(() => {
    if (abierto) {
      setFormulario({
        fecha: initialFecha || new Date().toISOString().split('T')[0],
        horaInicio: initialHoraInicio || '08:15',
        horaFin: initialHoraFin || '09:45',
        numeroComputadora: '',
        motivo: '',
      });

      if (reservasExistentes && reservasExistentes.length > 0) {
        setListaReservas(reservasExistentes);
      }

      // Sincronizar reservas del calendario en tiempo real
      apiClient.get(`/api/laboratorios/${laboratorioId}/calendario`)
        .then((res) => {
          if (res.data?.reservas) {
            setListaReservas(res.data.reservas);
          }
        })
        .catch(() => null);
    }
  }, [abierto, laboratorioId, reservasExistentes, initialFecha, initialHoraInicio, initialHoraFin]);

  // Cálculo de computadoras ocupadas en el intervalo seleccionado
  const { computadorasOcupadas, aulaCompletaOcupada } = useMemo(() => {
    if (!formulario.fecha || !formulario.horaInicio || !formulario.horaFin) {
      return { computadorasOcupadas: new Set<number>(), aulaCompletaOcupada: false };
    }

    const inicioSel = new Date(`${formulario.fecha}T${formulario.horaInicio}:00-04:00`).getTime();
    const finSel = new Date(`${formulario.fecha}T${formulario.horaFin}:00-04:00`).getTime();
    const ocupadas = new Set<number>();
    let aulaCompleta = false;
    const ESTADOS_ACTIVOS = ['Pendiente', 'Aprobada', 'Confirmada', 'Asistió'];

    for (const r of listaReservas) {
      if (!ESTADOS_ACTIVOS.includes(r.estado)) continue;
      const rIni = new Date(r.fechaInicio).getTime();
      const rFin = new Date(r.fechaFin).getTime();

      if (rIni < finSel && rFin > inicioSel) {
        if (r.numeroComputadora === null || r.numeroComputadora === undefined) {
          aulaCompleta = true;
        } else {
          ocupadas.add(Number(r.numeroComputadora));
        }
      }
    }

    return { computadorasOcupadas: ocupadas, aulaCompletaOcupada: aulaCompleta };
  }, [listaReservas, formulario.fecha, formulario.horaInicio, formulario.horaFin]);

  // Si la computadora elegida se ocupa por cambio de horario, deseleccionarla
  useEffect(() => {
    if (formulario.numeroComputadora) {
      const pcNum = Number(formulario.numeroComputadora);
      if (computadorasOcupadas.has(pcNum) || aulaCompletaOcupada) {
        setFormulario((actual) => ({ ...actual, numeroComputadora: '' }));
      }
    }
  }, [computadorasOcupadas, aulaCompletaOcupada]);

  if (!abierto) return null;

  const actualizarCampo = (campo: keyof ReservaForm, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const handleHoraInicioChange = (nuevaHoraInicio: string) => {
    let nuevaHoraFin = formulario.horaFin;
    if (timeToMinutes(formulario.horaFin) < timeToMinutes(nuevaHoraInicio) + 60) {
      nuevaHoraFin = calcularHoraFinSugerida(nuevaHoraInicio, formulario.fecha);
    }
    setFormulario((actual) => ({
      ...actual,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHoraFin,
    }));
  };

  const handleHoraFinChange = (nuevaHoraFin: string) => {
    let nuevaHoraInicio = formulario.horaInicio;
    if (timeToMinutes(nuevaHoraFin) <= timeToMinutes(formulario.horaInicio)) {
      const nuevoInicioMins = Math.max(360, timeToMinutes(nuevaHoraFin) - 60);
      nuevaHoraInicio = minutesToTime(nuevoInicioMins);
    }
    setFormulario((actual) => ({
      ...actual,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHoraFin,
    }));
  };

  const handleFechaChange = (nuevaFecha: string) => {
    let nuevaHoraInicio = formulario.horaInicio;
    let nuevaHoraFin = formulario.horaFin;
    if (esDiaSabado(nuevaFecha)) {
      if (timeToMinutes(nuevaHoraInicio) > timeToMinutes('11:45')) {
        nuevaHoraInicio = '11:15';
      }
      if (timeToMinutes(nuevaHoraFin) > timeToMinutes('12:45')) {
        nuevaHoraFin = '12:45';
      }
    }
    setFormulario((actual) => ({
      ...actual,
      fecha: nuevaFecha,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHoraFin,
    }));
  };

  const cerrar = () => {
    if (enviando) return;
    setFormulario(FORMULARIO_INICIAL);
    onCerrar();
  };

  const enviarReserva = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (aulaCompletaOcupada) {
      toast.error('El laboratorio completo está reservado en ese horario para una clase');
      return;
    }

    if (!formulario.numeroComputadora) {
      toast.error('Debes seleccionar una computadora disponible');
      return;
    }

    if (!formulario.fecha) {
      toast.error('La fecha de reserva es obligatoria');
      return;
    }

    if (!formulario.horaInicio || !formulario.horaFin) {
      toast.error('Debes indicar las horas de inicio y fin');
      return;
    }

    if (timeToMinutes(formulario.horaFin) - timeToMinutes(formulario.horaInicio) < 60) {
      toast.error('La duración mínima de uso de la computadora debe ser de al menos 1 hora (60 minutos)');
      return;
    }

    if (!formulario.motivo.trim()) {
      toast.error('El motivo de uso es obligatorio');
      return;
    }

    if (formulario.motivo.trim().length < 3) {
      toast.error('El motivo de uso debe tener al menos 3 caracteres');
      return;
    }

    const fechaInicioStr = `${formulario.fecha}T${formulario.horaInicio}:00-04:00`;
    const fechaFinStr = `${formulario.fecha}T${formulario.horaFin}:00-04:00`;

    setEnviando(true);
    try {
      const response = await apiClient.post(
        `/api/laboratorios/${laboratorioId}/reservas`,
        {
          fechaInicio: fechaInicioStr,
          fechaFin: fechaFinStr,
          numeroComputadora: Number(formulario.numeroComputadora),
          motivo: formulario.motivo.trim(),
        }
      );

      toast.success(response.data.message || 'Reserva de computadora confirmada con éxito');
      setFormulario(FORMULARIO_INICIAL);
      onReservaCreada();
      onCerrar();
    } catch (error: any) {
      const mensaje = error.response?.data?.error || error.message || 'No se pudo registrar la reserva';
      toast.error(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  const hoyStr = new Date().toISOString().split('T')[0];
  const computadorasTotal = Math.max(1, cantidadComputadoras || 1);
  const totalLibres = aulaCompletaOcupada ? 0 : Math.max(0, computadorasTotal - computadorasOcupadas.size);
  const totalOcupadas = aulaCompletaOcupada ? computadorasTotal : computadorasOcupadas.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reserva-computadora"
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 md:p-7 max-h-[94vh] overflow-y-auto my-auto"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <div>
            <h2 id="titulo-reserva-computadora" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-tech-blue" />
              <span>Reservar computadora</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{laboratorioNombre}</p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar formulario"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={enviarReserva} className="space-y-5">
          {/* Paso 1: Selección de Fecha y Franja Horaria */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <label htmlFor="reserva-pc-fecha" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-tech-blue" />
                <span>Fecha</span> <span className="text-red-500">*</span>
              </label>
              <input
                id="reserva-pc-fecha"
                type="date"
                required
                min={hoyStr}
                value={formulario.fecha}
                onChange={(event) => handleFechaChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-tech-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-tech-blue" />
                <span>Desde</span> <span className="text-red-500">*</span>
              </label>
              <TimePickerInput
                id="reserva-pc-desde"
                value={formulario.horaInicio}
                onChange={handleHoraInicioChange}
                minHora={6}
                maxHora={esDiaSabado(formulario.fecha) ? 12 : 21}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-tech-blue" />
                <span>Hasta</span> <span className="text-red-500">*</span>
              </label>
              <TimePickerInput
                id="reserva-pc-hasta"
                value={formulario.horaFin}
                onChange={handleHoraFinChange}
                minHora={7}
                maxHora={esDiaSabado(formulario.fecha) ? 13 : 22}
              />
            </div>
          </div>

          {/* Paso 2: Mapa y Grilla Interactiva de Computadoras */}
          <div>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-tech-blue" />
                <span>Mapa de Puestos de Trabajo ({computadorasTotal} PCs)</span>
                <span className="text-red-500">*</span>
              </label>

              {/* Leyenda interactiva de colores */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Libres ({totalLibres})
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Ocupadas ({totalOcupadas})
                </span>
              </div>
            </div>

            {aulaCompletaOcupada ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <span>
                  El laboratorio completo está reservado en esta fecha y horario para una clase académica. Elige otra franja horaria.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 max-h-56 overflow-y-auto">
                {Array.from({ length: computadorasTotal }, (_, indice) => indice + 1).map((numero) => {
                  const ocupada = computadorasOcupadas.has(numero);
                  const seleccionada = formulario.numeroComputadora === numero.toString();

                  return (
                    <button
                      key={numero}
                      type="button"
                      disabled={ocupada}
                      onClick={() => actualizarCampo('numeroComputadora', numero.toString())}
                      title={ocupada ? `PC-${numero} ocupada en este horario` : `Seleccionar PC-${numero}`}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        seleccionada
                          ? 'bg-tech-blue text-white border-tech-blue shadow-md scale-105 ring-2 ring-blue-500/40'
                          : ocupada
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 opacity-60 cursor-not-allowed'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
                      }`}
                    >
                      <Monitor
                        className={`w-4 h-4 mb-1 ${
                          seleccionada ? 'text-white' : ocupada ? 'text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      />
                      <span className="font-mono font-bold">PC-{numero}</span>
                      <span className="text-[9px] mt-0.5 font-normal">
                        {seleccionada ? 'Elegida' : ocupada ? 'Ocupada' : 'Libre'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mensaje de confirmación del puesto seleccionado */}
            <div className="mt-2 text-xs">
              {formulario.numeroComputadora ? (
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    Has seleccionado la computadora <strong>PC-{formulario.numeroComputadora}</strong> para tu reserva.
                  </span>
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  Haz clic sobre una computadora verde (Libre) para elegir tu estación de trabajo.
                </p>
              )}
            </div>
          </div>

          {/* Paso 3: Motivo de Uso */}
          <div>
            <label htmlFor="reserva-pc-motivo" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <span>Motivo de Uso</span> <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reserva-pc-motivo"
              required
              rows={2}
              maxLength={255}
              value={formulario.motivo}
              onChange={(event) => actualizarCampo('motivo', event.target.value)}
              placeholder="Ej. Práctica de programación, laboratorio de redes, autoestudio..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-tech-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !formulario.numeroComputadora || aulaCompletaOcupada}
              className="rounded-xl bg-tech-blue hover:bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 disabled:opacity-50 cursor-pointer transition flex items-center justify-center gap-2"
            >
              {enviando ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
