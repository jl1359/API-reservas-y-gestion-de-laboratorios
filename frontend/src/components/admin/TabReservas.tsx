import { useState } from 'react';
import axios from 'axios';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reservasApi } from '../../api/reservas.api';

export interface ReservaPendiente {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  materia: string;
  cantidadAlumnos: number;
  motivo: string | null;
  estado: string;
  usuario: { nombreCompleto: string; correo: string };
  laboratorio: { id: number; nombre: string; capacidad: number; ubicacion: string | null };
}

interface TabReservasProps {
  reservasPendientes: ReservaPendiente[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TabReservas({
  reservasPendientes,
  isLoading,
  onRefresh
}: TabReservasProps) {
  // Modal Rechazar
  const [isRechazarModalOpen, setIsRechazarModalOpen] = useState(false);
  const [reservaARechazar, setReservaARechazar] = useState<ReservaPendiente | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isSubmittingRechazo, setIsSubmittingRechazo] = useState(false);

  // Modal Fuerza Mayor
  const [isFuerzaMayorModalOpen, setIsFuerzaMayorModalOpen] = useState(false);
  const [reservaAFuerzaMayor, setReservaAFuerzaMayor] = useState<ReservaPendiente | null>(null);
  const [motivoFuerzaMayor, setMotivoFuerzaMayor] = useState('');
  const [isSubmittingFuerzaMayor, setIsSubmittingFuerzaMayor] = useState(false);

  const handleAprobarReserva = async (id: number) => {
    if (!window.confirm('¿Confirmar aprobación de esta reserva de laboratorio? Se emitirá el código QR de acceso.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3000/api/reservas/${id}/gestionar`,
        { accion: 'Aprobar' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reserva aprobada exitosamente y token QR emitido');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al aprobar reserva');
    }
  };

  const handleAbrirRechazo = (reserva: ReservaPendiente) => {
    setReservaARechazar(reserva);
    setMotivoRechazo('');
    setIsRechazarModalOpen(true);
  };

  const handleConfirmarRechazo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoRechazo.trim()) return toast.error('Debes ingresar un motivo de rechazo');
    if (!reservaARechazar) return;

    setIsSubmittingRechazo(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3000/api/reservas/${reservaARechazar.id}/gestionar`,
        { accion: 'Rechazar', motivoRechazo: motivoRechazo.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reserva rechazada y horario liberado para nuevas solicitudes');
      setIsRechazarModalOpen(false);
      setReservaARechazar(null);
      setMotivoRechazo('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al rechazar reserva');
    } finally {
      setIsSubmittingRechazo(false);
    }
  };

  const handleAbrirFuerzaMayor = (reserva: ReservaPendiente) => {
    setReservaAFuerzaMayor(reserva);
    setMotivoFuerzaMayor('');
    setIsFuerzaMayorModalOpen(true);
  };

  const handleConfirmarFuerzaMayor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaAFuerzaMayor) return;
    if (motivoFuerzaMayor.trim().length < 5) {
      return toast.error('Ingresa una justificación formal de al menos 5 caracteres');
    }
    setIsSubmittingFuerzaMayor(true);
    try {
      await reservasApi.cancelarReservaFuerzaMayor(reservaAFuerzaMayor.id, motivoFuerzaMayor.trim());
      toast.success('Reserva cancelada por fuerza mayor y notificación urgente enviada');
      setIsFuerzaMayorModalOpen(false);
      setReservaAFuerzaMayor(null);
      setMotivoFuerzaMayor('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al procesar cancelación');
    } finally {
      setIsSubmittingFuerzaMayor(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 font-bold">Laboratorio</th>
              <th className="px-6 py-4 font-bold">Docente Solicitante</th>
              <th className="px-6 py-4 font-bold">Materia / Alumnos</th>
              <th className="px-6 py-4 font-bold">Fecha y Horario</th>
              <th className="px-6 py-4 font-bold">Motivo</th>
              <th className="px-6 py-4 font-bold text-right">Decisión</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                </td>
              </tr>
            ) : reservasPendientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No hay reservas pendientes de aprobación.</p>
                  <p className="text-xs text-slate-400 mt-1">Todas las solicitudes han sido gestionadas.</p>
                </td>
              </tr>
            ) : (
              reservasPendientes.map((res) => {
                const start = new Date(res.fechaInicio);
                const end = new Date(res.fechaFin);
                return (
                  <tr
                    key={res.id}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{res.laboratorio.nombre}</p>
                      <p className="text-xs text-slate-500">{res.laboratorio.ubicacion || 'Campus Central'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{res.usuario.nombreCompleto}</p>
                      <p className="text-xs text-slate-500">{res.usuario.correo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-tech-blue dark:text-blue-400">
                        {res.materia || 'Práctica General'}
                      </p>
                      <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold mt-1">
                        {res.cantidadAlumnos} alumnos
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {start.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Clock className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                        {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={res.motivo || 'Sin justificación'}>
                      {res.motivo || <span className="text-slate-400 italic">Sin justificación</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleAprobarReserva(res.id)}
                        title="Aprobar Reserva"
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleAbrirRechazo(res)}
                        title="Rechazar Reserva"
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleAbrirFuerzaMayor(res)}
                        title="Cancelar por Fuerza Mayor"
                        className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Fuerza Mayor */}
      {isFuerzaMayorModalOpen && reservaAFuerzaMayor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                Cancelación por Fuerza Mayor
              </h2>
              <button onClick={() => setIsFuerzaMayorModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarFuerzaMayor} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <p><strong>Docente:</strong> {reservaAFuerzaMayor.usuario?.nombreCompleto}</p>
                <p><strong>Laboratorio:</strong> {reservaAFuerzaMayor.laboratorio?.nombre}</p>
                <p><strong>Horario:</strong> {new Date(reservaAFuerzaMayor.fechaInicio).toLocaleString('es-ES')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justificación de Fuerza Mayor <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoFuerzaMayor}
                  onChange={(e) => setMotivoFuerzaMayor(e.target.value)}
                  placeholder="Detalla el imprevisto institucional..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                Se notificará formalmente al usuario y se liberará el laboratorio.
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFuerzaMayorModalOpen(false)}
                  disabled={isSubmittingFuerzaMayor}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFuerzaMayor}
                  className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow transition flex items-center"
                >
                  {isSubmittingFuerzaMayor ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rechazar Reserva con Motivo Obligatorio */}
      {isRechazarModalOpen && reservaARechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                Rechazar Reserva
              </h2>
              <button onClick={() => setIsRechazarModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRechazo} className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Indica el motivo de rechazo para la reserva de <strong>{reservaARechazar.usuario.nombreCompleto}</strong> en <strong>{reservaARechazar.laboratorio.nombre}</strong>:
                </p>
                <textarea
                  required
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej. Solicitud no justificada para la materia, cupo docente no habilitado..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none dark:text-white resize-none"
                />
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-red-800 dark:text-red-300 text-xs">
                El docente recibirá una notificación con este motivo y el espacio quedará disponible.
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsRechazarModalOpen(false)}
                  disabled={isSubmittingRechazo}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRechazo}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow transition flex items-center"
                >
                  {isSubmittingRechazo ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
