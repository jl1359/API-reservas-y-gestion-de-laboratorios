import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, Clock, BookOpen, Users, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SolicitudReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  laboratorio: {
    id: number;
    nombre: string;
    capacidad: number;
  };
  onReservaExitosa: () => void;
}

export default function SolicitudReservaModal({
  isOpen,
  onClose,
  laboratorio,
  onReservaExitosa
}: SolicitudReservaModalProps) {
  // Fecha mínima: mañana o hoy
  const hoy = new Date().toISOString().split('T')[0];

  const [fecha, setFecha] = useState(hoy);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [materia, setMateria] = useState('');
  const [cantidadAlumnos, setCantidadAlumnos] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // Construir fechas ISO completas
    const fechaInicioISO = new Date(`${fecha}T${horaInicio}:00`).toISOString();
    const fechaFinISO = new Date(`${fecha}T${horaFin}:00`).toISOString();

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Debes iniciar sesión para realizar una reserva');
        return;
      }

      const res = await axios.post(
        'http://localhost:3000/api/reservas',
        {
          laboratorioId: laboratorio.id,
          fechaInicio: fechaInicioISO,
          fechaFin: fechaFinISO,
          materia: materia.trim(),
          cantidadAlumnos: alumnos,
          motivo: motivo.trim() || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        toast.success(res.data.mensaje || 'Solicitud de reserva registrada correctamente');
        onReservaExitosa();
        onClose();
      }
    } catch (error: any) {
      console.error('Error al solicitar reserva:', error);
      const msg = error.response?.data?.error || 'Error al procesar la solicitud de reserva';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-all">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-tech-blue dark:text-blue-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
                Solicitar Reserva de Laboratorio
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
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
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
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white transition"
            />
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

          {/* Aviso informativo de aprobación */}
          <div className="flex items-start p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>
              La solicitud entrará en estado <strong>Pendiente</strong> y bloqueará el horario. El responsable del laboratorio la revisará para su confirmación oficial.
            </span>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-3">
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
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
