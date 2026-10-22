import { useState } from 'react';
import axios from 'axios';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Search,
  Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reservasApi } from '../../api/reservas.api';

export interface ReservaItem {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  materia?: string | null;
  cantidadAlumnos?: number;
  numeroComputadora?: number | null;
  motivo?: string | null;
  estado: string;
  tokenQr?: string | null;
  usuario?: { id: number; nombreCompleto: string; correo: string };
  laboratorio?: { id: number; nombre: string; capacidad: number; ubicacion: string | null; reservaPorComputadora?: boolean };
}

interface TabReservasProps {
  reservasList: ReservaItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TabReservas({
  reservasList,
  isLoading,
  onRefresh
}: TabReservasProps) {
  const [filtroEstado, setFiltroEstado] = useState<string>('Todas');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal Rechazar (reservas legadas pendientes)
  const [isRechazarModalOpen, setIsRechazarModalOpen] = useState(false);
  const [reservaARechazar, setReservaARechazar] = useState<ReservaItem | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isSubmittingRechazo, setIsSubmittingRechazo] = useState(false);

  // Modal Fuerza Mayor
  const [isFuerzaMayorModalOpen, setIsFuerzaMayorModalOpen] = useState(false);
  const [reservaAFuerzaMayor, setReservaAFuerzaMayor] = useState<ReservaItem | null>(null);
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

  const handleAbrirRechazo = (reserva: ReservaItem) => {
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
      toast.success('Reserva rechazada y horario liberado para nuevas reservas');
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

  const handleAbrirFuerzaMayor = (reserva: ReservaItem) => {
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

  // Filtrado reactivo de reservas
  const reservasFiltradas = reservasList.filter((res) => {
    const cumpleEstado = filtroEstado === 'Todas' || res.estado === filtroEstado;
    const q = busqueda.toLowerCase().trim();
    if (!q) return cumpleEstado;

    const nomLab = res.laboratorio?.nombre?.toLowerCase() || '';
    const nomDoc = res.usuario?.nombreCompleto?.toLowerCase() || '';
    const emailDoc = res.usuario?.correo?.toLowerCase() || '';
    const materia = res.materia?.toLowerCase() || '';
    const motivo = res.motivo?.toLowerCase() || '';

    const cumpleBusqueda =
      nomLab.includes(q) ||
      nomDoc.includes(q) ||
      emailDoc.includes(q) ||
      materia.includes(q) ||
      motivo.includes(q);

    return cumpleEstado && cumpleBusqueda;
  });

  const conteoAprobadas = reservasList.filter((r) => r.estado === 'Aprobada').length;
  const conteoCompletadas = reservasList.filter((r) => r.estado === 'Completada').length;
  const conteoPendientes = reservasList.filter((r) => r.estado === 'Pendiente').length;
  const conteoCanceladas = reservasList.filter((r) => r.estado === 'Cancelada' || r.estado === 'Cancelada (Fuerza Mayor)').length;
  const conteoAusentes = reservasList.filter((r) => r.estado === 'Ausente').length;

  return (
    <div className="space-y-6">
      {/* Barra de Controles y Filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado('Todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'Todas'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({reservasList.length})
          </button>
          <button
            onClick={() => setFiltroEstado('Aprobada')}
            className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'Aprobada'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
            }`}
          >
            Aprobadas ({conteoAprobadas})
          </button>
          <button
            onClick={() => setFiltroEstado('Completada')}
            className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'Completada'
                ? 'bg-blue-600 text-white shadow'
                : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100'
            }`}
          >
            Completadas ({conteoCompletadas})
          </button>
          {conteoPendientes > 0 && (
            <button
              onClick={() => setFiltroEstado('Pendiente')}
              className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filtroEstado === 'Pendiente'
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
              }`}
            >
              Pendientes ({conteoPendientes})
            </button>
          )}
          <button
            onClick={() => setFiltroEstado('Ausente')}
            className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'Ausente'
                ? 'bg-rose-600 text-white shadow'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100'
            }`}
          >
            Ausentes ({conteoAusentes})
          </button>
          <button
            onClick={() => setFiltroEstado('Cancelada')}
            className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'Cancelada'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Canceladas ({conteoCanceladas})
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por titular, aula o materia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
          />
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">Laboratorio</th>
                <th className="px-6 py-4 font-bold">Docente / Titular</th>
                <th className="px-6 py-4 font-bold">Materia / Tipo</th>
                <th className="px-6 py-4 font-bold">Fecha y Horario</th>
                <th className="px-6 py-4 font-bold text-center">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : reservasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No se encontraron reservas registradas.</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o el término de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((res) => {
                  const start = new Date(res.fechaInicio);
                  const end = new Date(res.fechaFin);

                  const estadoBadge = (() => {
                    switch (res.estado) {
                      case 'Aprobada':
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Aprobada
                          </span>
                        );
                      case 'Completada':
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <CheckCircle className="w-3 h-3 mr-1 text-blue-600" /> Completada
                          </span>
                        );
                      case 'Pendiente':
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pendiente
                          </span>
                        );
                      case 'Ausente':
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            Ausente (Sanción 24h)
                          </span>
                        );
                      default:
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {res.estado}
                          </span>
                        );
                    }
                  })();

                  return (
                    <tr
                      key={res.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{res.laboratorio?.nombre || 'Laboratorio'}</p>
                        <p className="text-xs text-slate-500">{res.laboratorio?.ubicacion || 'Campus Central'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{res.usuario?.nombreCompleto || 'Usuario del Campus'}</p>
                        <p className="text-xs text-slate-500">{res.usuario?.correo}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-tech-blue dark:text-blue-400">
                          {res.materia || 'Práctica Individual / Libre'}
                        </p>
                        {res.numeroComputadora ? (
                          <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-bold mt-1 border border-indigo-200 dark:border-indigo-800">
                            <Monitor className="w-3 h-3 mr-1" /> Estación #{res.numeroComputadora}
                          </span>
                        ) : (
                          <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold mt-1">
                            Aula completa ({res.cantidadAlumnos || 1} alumnos)
                          </span>
                        )}
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
                      <td className="px-6 py-4 text-center">
                        {estadoBadge}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {res.estado === 'Pendiente' && (
                          <>
                            <button
                              onClick={() => handleAprobarReserva(res.id)}
                              title="Aprobar Reserva Manualmente"
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAbrirRechazo(res)}
                              title="Rechazar Reserva"
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {res.estado === 'Aprobada' && (
                          <button
                            onClick={() => handleAbrirFuerzaMayor(res)}
                            title="Cancelar por Fuerza Mayor"
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            Fuerza Mayor
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rechazar Reserva Pendiente */}
      {isRechazarModalOpen && reservaARechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-red-500" />
                Rechazar Reserva
              </h2>
              <button onClick={() => setIsRechazarModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRechazo} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Al rechazar esta reserva, el horario quedará liberado inmediatamente para otros docentes y estudiantes.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de Rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej. Solicitud no justificada, cupo docente no habilitado..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRechazarModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRechazo}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmittingRechazo ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fuerza Mayor */}
      {isFuerzaMayorModalOpen && reservaAFuerzaMayor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
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
                <p><strong>Titular:</strong> {reservaAFuerzaMayor.usuario?.nombreCompleto}</p>
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
                  placeholder="Ej. Evento institucional impostergable, corte de energía en el campus, mantenimiento de emergencia..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFuerzaMayorModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFuerzaMayor}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmittingFuerzaMayor ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
