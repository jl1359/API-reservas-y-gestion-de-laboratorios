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
  Monitor,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reservasApi } from '../../api/reservas.api';
import { imprimirBoletaOficial } from '../../utils/boletaPdf';

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
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => setFiltroEstado('Todas')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filtroEstado === 'Todas'
                ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas <span className="font-normal opacity-75">({reservasList.length})</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Aprobada')}
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all ${
              filtroEstado === 'Aprobada'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Aprobadas <span className="ml-1 font-normal text-emerald-600 dark:text-emerald-400">({conteoAprobadas})</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Completada')}
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all ${
              filtroEstado === 'Completada'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            Completadas <span className="ml-1 font-normal text-blue-600 dark:text-blue-400">({conteoCompletadas})</span>
          </button>
          {conteoPendientes > 0 && (
            <button
              onClick={() => setFiltroEstado('Pendiente')}
              className={`flex items-center px-3 py-1.5 rounded-xl transition-all ${
                filtroEstado === 'Pendiente'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              Pendientes <span className={`ml-1 font-normal ${filtroEstado === 'Pendiente' ? 'text-white/90' : 'text-amber-600 dark:text-amber-400'}`}>({conteoPendientes})</span>
            </button>
          )}
          <button
            onClick={() => setFiltroEstado('Ausente')}
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all ${
              filtroEstado === 'Ausente'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            Ausentes <span className={`ml-1 font-normal ${filtroEstado === 'Ausente' ? 'text-white/90' : 'text-rose-600 dark:text-rose-400'}`}>({conteoAusentes})</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Cancelada')}
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all ${
              filtroEstado === 'Cancelada'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Canceladas <span className="ml-1 font-normal opacity-75">({conteoCanceladas})</span>
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

      {/* Vista de Tabla para Escritorio y Tablets Grandes */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading border-b border-slate-150 dark:border-slate-800 text-xs tracking-wide">
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Aprobada
                          </span>
                        );
                      case 'Completada':
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <CheckCircle className="w-3 h-3 mr-1 text-blue-600" /> Completada
                          </span>
                        );
                      case 'Pendiente':
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pendiente
                          </span>
                        );
                      case 'Ausente':
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Ausente (Sanción 24h)
                          </span>
                        );
                      default:
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => imprimirBoletaOficial(res as any)}
                              title="Imprimir Boleta Oficial de Acreditación PDF"
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Boleta
                            </button>
                            <button
                              onClick={() => handleAbrirFuerzaMayor(res)}
                              title="Cancelar por Fuerza Mayor"
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/30 rounded-xl transition-all shadow-xs active:scale-[0.98]"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                              Fuerza Mayor
                            </button>
                          </div>
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

      {/* Vista de Tarjetas Móvil para Reservas (Smartphones y Tablets) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-slate-500 text-sm">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-medium">No se encontraron reservas registradas.</p>
          </div>
        ) : (
          reservasFiltradas.map((res) => {
            const start = new Date(res.fechaInicio);
            const end = new Date(res.fechaFin);

            const estadoBadge = (() => {
              switch (res.estado) {
                case 'Aprobada':
                  return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Aprobada
                    </span>
                  );
                case 'Completada':
                  return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <CheckCircle className="w-3 h-3 mr-1 text-blue-600" /> Completada
                    </span>
                  );
                case 'Pendiente':
                  return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Pendiente
                    </span>
                  );
                case 'Ausente':
                  return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Ausente (Sanción 24h)
                    </span>
                  );
                default:
                  return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                      {res.estado}
                    </span>
                  );
              }
            })();

            return (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm truncate">
                      {res.laboratorio?.nombre || 'Laboratorio'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {res.laboratorio?.ubicacion || 'Campus Central'}
                    </p>
                  </div>
                  <div className="shrink-0">{estadoBadge}</div>
                </div>

                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-xs space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Titular: <span className="font-normal text-slate-600 dark:text-slate-400">{res.usuario?.nombreCompleto}</span>
                  </p>
                  <p className="text-slate-500 truncate">{res.usuario?.correo}</p>
                  <div className="pt-1 flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-tech-blue dark:text-blue-400 truncate max-w-[180px]">
                      {res.materia || 'Práctica Libre'}
                    </span>
                    <span>
                      {res.numeroComputadora ? `PC #${res.numeroComputadora}` : `${res.cantidadAlumnos || 1} alumnos`}
                    </span>
                  </div>
                  <p className="text-slate-500 pt-0.5 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-tech-blue shrink-0" />
                    {start.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}, {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Acciones móviles */}
                {res.estado === 'Pendiente' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleAprobarReserva(res.id)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs active:scale-[0.98] transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Aprobar</span>
                    </button>
                    <button
                      onClick={() => handleAbrirRechazo(res)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold text-xs active:scale-[0.98] transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}

                {res.estado === 'Aprobada' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => imprimirBoletaOficial(res as any)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Boleta PDF</span>
                    </button>
                    <button
                      onClick={() => handleAbrirFuerzaMayor(res)}
                      className="py-2.5 px-3 flex items-center justify-center space-x-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30 font-semibold text-xs active:scale-[0.98] transition-all"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Fuerza Mayor</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Rechazar Reserva Pendiente */}
      {isRechazarModalOpen && reservaARechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800">
              <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-rose-500" />
                Rechazar Reserva
              </h2>
              <button onClick={() => setIsRechazarModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRechazo} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El horario quedará disponible de inmediato para otros solicitantes.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de Rechazo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej. Solicitud no justificada, cupo docente no habilitado..."
                  className="w-full px-3 py-2 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRechazarModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRechazo}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm shadow-rose-600/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800">
              <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                Cancelación por Fuerza Mayor
              </h2>
              <button onClick={() => setIsFuerzaMayorModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarFuerzaMayor} className="mt-4 space-y-4">
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p><strong>Titular:</strong> {reservaAFuerzaMayor.usuario?.nombreCompleto}</p>
                <p><strong>Laboratorio:</strong> {reservaAFuerzaMayor.laboratorio?.nombre}</p>
                <p><strong>Horario:</strong> {new Date(reservaAFuerzaMayor.fechaInicio).toLocaleString('es-ES')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justificación de Fuerza Mayor <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoFuerzaMayor}
                  onChange={(e) => setMotivoFuerzaMayor(e.target.value)}
                  placeholder="Ej. Evento institucional impostergable, corte de energía en el campus, mantenimiento de emergencia..."
                  className="w-full px-3 py-2 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFuerzaMayorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFuerzaMayor}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm shadow-rose-600/20"
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
