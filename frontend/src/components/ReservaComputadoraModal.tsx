import { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReservaComputadoraModalProps {
  abierto: boolean;
  laboratorioId: number;
  laboratorioNombre: string;
  cantidadComputadoras: number;
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
  onCerrar,
  onReservaCreada,
}: ReservaComputadoraModalProps) {
  const [formulario, setFormulario] = useState<ReservaForm>(FORMULARIO_INICIAL);
  const [enviando, setEnviando] = useState(false);

  if (!abierto) return null;

  const actualizarCampo = (campo: keyof ReservaForm, valor: string) => {
    setFormulario(actual => ({ ...actual, [campo]: valor }));
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

    const fechaInicio = new Date(`${formulario.fecha}T${formulario.horaInicio}:00`);
    const fechaFin = new Date(`${formulario.fecha}T${formulario.horaFin}:00`);

    if (fechaInicio >= fechaFin) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setEnviando(true);
    try {
      const response = await axios.post(
        `http://localhost:3000/api/laboratorios/${laboratorioId}/reservas`,
        {
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          numeroComputadora: Number(formulario.numeroComputadora),
          motivo: formulario.motivo,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      );

      toast.success(response.data.message);
      setFormulario(FORMULARIO_INICIAL);
      onReservaCreada();
      onCerrar();
    } catch (error) {
      const mensaje = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      toast.error(mensaje || 'No se pudo registrar la reserva');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reserva-computadora"
        className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 md:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="titulo-reserva-computadora" className="text-2xl font-bold text-slate-900 dark:text-white">
              Reservar computadora
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{laboratorioNombre}</p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar formulario"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={enviarReserva} className="space-y-5">
          <div>
            <label htmlFor="numeroComputadora" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Computadora
            </label>
            <select
              id="numeroComputadora"
              required
              value={formulario.numeroComputadora}
              onChange={event => actualizarCampo('numeroComputadora', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-tech-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Selecciona una computadora</option>
              {Array.from({ length: cantidadComputadoras }, (_, indice) => indice + 1).map(numero => (
                <option key={numero} value={numero}>PC-{numero}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Fecha
              <input
                type="date"
                required
                value={formulario.fecha}
                onChange={event => actualizarCampo('fecha', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Desde
              <input
                type="time"
                required
                value={formulario.horaInicio}
                onChange={event => actualizarCampo('horaInicio', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Hasta
              <input
                type="time"
                required
                value={formulario.horaFin}
                onChange={event => actualizarCampo('horaFin', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Motivo <span className="font-normal text-slate-400">(opcional)</span>
            <textarea
              rows={3}
              maxLength={255}
              value={formulario.motivo}
              onChange={event => actualizarCampo('motivo', event.target.value)}
              placeholder="Ej. Práctica de programación"
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-tech-blue px-6 py-3 font-bold text-white disabled:opacity-60"
            >
              {enviando ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
