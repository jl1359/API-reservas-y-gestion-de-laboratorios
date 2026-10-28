import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, Users, FileText, CheckCircle, AlertCircle, Repeat } from 'lucide-react';
import toast from 'react-hot-toast';
import { feriadosApi } from '../api/feriados.api';
import apiClient from '../api/client';

interface SolicitudReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  laboratorio: {
    id: number;
    nombre: string;
    capacidad: number;
  };
  onReservaExitosa: () => void;
  initialFecha?: string;
  initialHoraInicio?: string;
  initialHoraFin?: string;
}

export default function SolicitudReservaModal({
  isOpen,
  onClose,
  laboratorio,
  onReservaExitosa,
  initialFecha,
  initialHoraInicio,
  initialHoraFin
}: SolicitudReservaModalProps) {
  // Fecha mínima: mañana o hoy
  const hoy = new Date().toISOString().split('T')[0];
  // Fecha fin de semestre sugerida: 4 meses adelante
  const fechaFinSugerida = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fecha, setFecha] = useState(hoy);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [materia, setMateria] = useState('');
  const [cantidadAlumnos, setCantidadAlumnos] = useState('');
  const [motivo, setMotivo] = useState('');
  const [recurrente, setRecurrente] = useState(false);
  const [fechaFinSemestre, setFechaFinSemestre] = useState(fechaFinSugerida);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feriados, setFeriados] = useState<{ id: number; fecha: string; motivo: string; bloqueoActivo: boolean }[]>([]);

  // Cargar feriados para bloqueo anticipado en el calendario
  React.useEffect(() => {
    if (isOpen) {
      if (initialFecha) setFecha(initialFecha);
      if (initialHoraInicio) setHoraInicio(initialHoraInicio);
      if (initialHoraFin) setHoraFin(initialHoraFin);
      feriadosApi.listar()
        .then(lista => {
          setFeriados(lista.filter((f: any) => f.bloqueoActivo));
        })
        .catch(() => {});
    }
  }, [isOpen, initialFecha, initialHoraInicio, initialHoraFin]);

  // Identificar si la fecha seleccionada coincide con un feriado institucional
  const feriadoSeleccionado = feriados.find(f => {
    const fStr = f.fecha.split('T')[0];
    return fStr === fecha;
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (feriadoSeleccionado) {
      return toast.error(`No se puede reservar: El día seleccionado está bloqueado (${feriadoSeleccionado.motivo})`);
    }

    if (!materia.trim()) {
      return toast.error('El nombre de la materia es obligatorio');
    }

    const alumnos = Number(cantidadAlumnos);
    if (!alumnos || alumnos <= 0) {
      return toast.error('La cantidad de alumnos debe ser mayor a 0');
    }

    if (alumnos > laboratorio.capacidad) {
      return toast.error(`Excede la capacidad máxima del laboratorio (${laboratorio.capacidad} alumnos)`);
    }

    if (horaInicio >= horaFin) {
      return toast.error('La hora de inicio debe ser anterior a la hora de fin');
    }

    if (recurrente && (!fechaFinSemestre || fechaFinSemestre <= fecha)) {
      return toast.error('La fecha de fin de semestre debe ser posterior a la fecha inicial');
    }

    // Construir fechas ISO completas
    const fechaInicioISO = new Date(`${fecha}T${horaInicio}:00`).toISOString();
    const fechaFinISO = new Date(`${fecha}T${horaFin}:00`).toISOString();
    const fechaFinSemestreISO = recurrente ? new Date(`${fechaFinSemestre}T${horaFin}:00`).toISOString() : undefined;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Debes iniciar sesión para realizar una reserva');
        return;
      }

      const res = await apiClient.post('/api/reservas', {
        laboratorioId: laboratorio.id,
        fechaInicio: fechaInicioISO,
        fechaFin: fechaFinISO,
        materia: materia.trim(),
        cantidadAlumnos: alumnos,
        motivo: motivo.trim() || undefined,
        recurrente,
        fechaFinSemestre: fechaFinSemestreISO
      });

      if (res.data.success) {
        toast.success(res.data.mensaje || 'Reserva registrada y confirmada correctamente');
        onReservaExitosa();
        onClose();
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al procesar la reserva';
      toast.error(msg, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col max-h-[92vh] my-auto transition-all">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-tech-blue dark:text-blue-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
                Reservar Laboratorio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {laboratorio.nombre} • Capacidad máx: {laboratorio.capacidad} personas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Materia / Asignatura */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
              <BookOpen className="w-4 h-4 mr-1.5 text-tech-blue" />
              Materia o Asignatura <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="Ej. Redes de Computadoras I, Física II..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white transition"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-tech-blue" />
              Fecha de la Práctica <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="date"
              required
              min={hoy}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:outline-none dark:text-white transition ${
                feriadoSeleccionado
                  ? 'border-red-500 focus:ring-red-400 bg-red-50/50 dark:bg-red-950/20'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-tech-blue'
              }`}
            />
            {feriadoSeleccionado && (
              <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center animate-fade-in">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>
                  <strong>Día no laborable o feriado:</strong> {feriadoSeleccionado.motivo}. No hay actividades programadas en esta fecha.
                </span>
              </div>
            )}
          </div>

          {/* Horario: Inicio y Fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-tech-blue" />
                Hora Inicio <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="time"
                required
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-tech-blue" />
                Hora Fin <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="time"
                required
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white transition"
              />
            </div>
          </div>

          {/* Cantidad de Alumnos */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-tech-blue" />
                Cantidad Estimada de Alumnos <span className="text-red-500 ml-0.5">*</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Máx: <strong className="text-slate-800 dark:text-white">{laboratorio.capacidad}</strong>
              </span>
            </div>
            <input
              type="number"
              required
              min={1}
              max={laboratorio.capacidad}
              value={cantidadAlumnos}
              onChange={(e) => setCantidadAlumnos(e.target.value)}
              placeholder={`Ej. 25 (Hasta ${laboratorio.capacidad})`}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white transition"
            />
          </div>

          {/* Motivo o Justificación */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-tech-blue" />
              Objetivo / Justificación de la Sesión
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Examen parcial práctico, simulación de redes en Cisco Packet Tracer..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white transition resize-none"
            />
          </div>

          {/* Opciones de Recurrencia Semestral */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="recurrente-toggle" className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center cursor-pointer">
                <Repeat className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                Repetir semanalmente todo el semestre
              </label>
              <input
                id="recurrente-toggle"
                type="checkbox"
                checked={recurrente}
                onChange={(e) => setRecurrente(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {recurrente && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 animate-fade-in space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Fecha límite del semestre académico:
                </label>
                <input
                  type="date"
                  required={recurrente}
                  min={fecha}
                  value={fechaFinSemestre}
                  onChange={(e) => setFechaFinSemestre(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Reserva semanal sujeta a disponibilidad continua de fechas.
                </p>
              </div>
            )}
          </div>

          {/* Aviso informativo de aprobación */}
          <div className="flex items-start p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Confirmación inmediata:</strong> Tu código QR de ingreso se generará al instante.
            </span>
          </div>

          {/* Botones de acción */}
          </div>
          <div className="flex justify-end space-x-3 p-4 px-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 rounded-b-3xl shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(feriadoSeleccionado)}
              title={feriadoSeleccionado ? 'Día bloqueado por feriado' : undefined}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {feriadoSeleccionado ? 'Día Inhabilitado' : 'Confirmar Reserva'}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}