import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Monitor, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import {
  obtenerOpcionesHoraInicio,
  obtenerOpcionesHoraFin,
  calcularHoraFinSugerida,
  timeToMinutes,
  esDiaSabado
} from '../utils/horariosAcademicos';

interface ReservaComputadoraModalProps {
  abierto: boolean;
  laboratorioId: number;
  laboratorioNombre: string;
  cantidadComputadoras: number;
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
  fecha: '',
  horaInicio: '',
  horaFin: '',
  numeroComputadora: '',
  motivo: '',
};

export default function ReservaComputadoraModal({
  abierto,
  laboratorioId,
  laboratorioNombre,
  cantidadComputadoras,
  initialFecha,
  initialHoraInicio,
  initialHoraFin,
  onCerrar,
  onReservaCreada,
}: ReservaComputadoraModalProps) {
  const [formulario, setFormulario] = useState<ReservaForm>(FORMULARIO_INICIAL);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (abierto) {
      setFormulario({
        fecha: initialFecha || new Date().toISOString().split('T')[0],
        horaInicio: initialHoraInicio || '08:15',
        horaFin: initialHoraFin || '09:45',
        numeroComputadora: '',
        motivo: '',
      });
    }
  }, [abierto, initialFecha, initialHoraInicio, initialHoraFin]);

  if (!abierto) return null;

  const actualizarCampo = (campo: keyof ReservaForm, valor: string) => {
    setFormulario(actual => ({ ...actual, [campo]: valor }));
  };

  const opcionesInicio = useMemo(() => {
    return obtenerOpcionesHoraInicio(formulario.fecha, formulario.horaInicio);
  }, [formulario.fecha, formulario.horaInicio]);

  const opcionesFin = useMemo(() => {
    return obtenerOpcionesHoraFin(formulario.horaInicio, formulario.fecha, formulario.horaFin);
  }, [formulario.horaInicio, formulario.fecha, formulario.horaFin]);

  const handleHoraInicioChange = (nuevaHoraInicio: string) => {
    let nuevaHoraFin = formulario.horaFin;
    if (timeToMinutes(formulario.horaFin) < timeToMinutes(nuevaHoraInicio) + 60) {
      nuevaHoraFin = calcularHoraFinSugerida(nuevaHoraInicio, formulario.fecha);
    }
    setFormulario(actual => ({
      ...actual,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHoraFin
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
    setFormulario(actual => ({
      ...actual,
      fecha: nuevaFecha,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHoraFin
    }));
  };

  const cerrar = () => {
    if (enviando) return;
    setFormulario(FORMULARIO_INICIAL);
    onCerrar();
  };

  const enviarReserva = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formulario.numeroComputadora) {
      toast.error('Debes seleccionar una computadora');
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

    const fechaInicioStr = `${formulario.fecha}T${formulario.horaInicio}:00`;
    const fechaFinStr = `${formulario.fecha}T${formulario.horaFin}:00`;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reserva-computadora"
        className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 md:p-8 max-h-[92vh] overflow-y-auto my-auto"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="titulo-reserva-computadora" className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-6 h-6 text-tech-blue" />
              <span>Reservar computadora</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{laboratorioNombre}</p>
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
          <div>
            <label htmlFor="numeroComputadora" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Computadora <span className="text-red-500">*</span>
            </label>
            <select
              id="numeroComputadora"
              required
              value={formulario.numeroComputadora}
              onChange={event => actualizarCampo('numeroComputadora', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-tech-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Selecciona una computadora (PC-1 a PC-{cantidadComputadoras})</option>
              {Array.from({ length: cantidadComputadoras }, (_, indice) => indice + 1).map(numero => (
                <option key={numero} value={numero}>PC-{numero}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="reserva-pc-fecha" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-tech-blue" />
                <span>Fecha</span> <span className="text-red-500">*</span>
              </label>
              <input
                id="reserva-pc-fecha"
                type="date"
                required
                min={hoyStr}
                value={formulario.fecha}
                onChange={event => handleFechaChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-tech-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="reserva-pc-desde" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-tech-blue" />
                <span>Desde</span> <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="reserva-pc-desde"
                  required
                  value={formulario.horaInicio}
                  onChange={event => handleHoraInicioChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-8 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-tech-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white cursor-pointer appearance-none"
                >
                  {opcionesInicio.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="reserva-pc-hasta" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-tech-blue" />
                <span>Hasta</span> <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="reserva-pc-hasta"
                  required
                  value={formulario.horaFin}
                  onChange={event => actualizarCampo('horaFin', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-8 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-tech-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white cursor-pointer appearance-none"
                >
                  {opcionesFin.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reserva-pc-motivo" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <span>Motivo de Uso</span> <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reserva-pc-motivo"
              required
              rows={3}
              maxLength={255}
              value={formulario.motivo}
              onChange={event => actualizarCampo('motivo', event.target.value)}
              placeholder="Ej. Práctica de programación, laboratorio de redes, autoestudio..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-tech-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-tech-blue hover:bg-blue-600 px-6 py-3 font-bold text-white shadow-md shadow-blue-500/25 disabled:opacity-60 cursor-pointer transition"
            >
              {enviando ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}