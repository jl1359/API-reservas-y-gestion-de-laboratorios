import { useState } from 'react';
import apiClient from '../../api/client';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { reservasApi } from '../../api/reservas.api';
import ModalRechazoReserva from './reservas/ModalRechazoReserva';
import ModalFuerzaMayor from './reservas/ModalFuerzaMayor';
import TablaGestionReservas from './reservas/TablaGestionReservas';

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
      await apiClient.put(`/api/reservas/${id}/gestionar`, { accion: 'Aprobar' });
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
      await apiClient.put(`/api/reservas/${reservaARechazar.id}/gestionar`, {
        accion: 'Rechazar',
        motivoRechazo: motivoRechazo.trim()
      });
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
    const cumpleEstado =
      filtroEstado === 'Todas' ||
      (filtroEstado === 'Completada' && (res.estado === 'Completada' || res.estado === 'Asistió')) ||
      (filtroEstado === 'Cancelada' && (res.estado === 'Cancelada' || res.estado === 'Cancelada (Fuerza Mayor)')) ||
      res.estado === filtroEstado;
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
  const conteoCompletadas = reservasList.filter((r) => r.estado === 'Completada' || r.estado === 'Asistió').length;
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
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filtroEstado === 'Todas'
                ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas <span className="font-normal opacity-75">({reservasList.length})</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Aprobada')}
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filtroEstado === 'Aprobada'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Aprobadas <span className={`ml-1 font-normal ${filtroEstado === 'Aprobada' ? 'text-white/90' : 'text-emerald-600 dark:text-emerald-400'}`}>({conteoAprobadas})</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Completada')}
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filtroEstado === 'Completada'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            Completadas <span className={`ml-1 font-normal ${filtroEstado === 'Completada' ? 'text-white/90' : 'text-blue-600 dark:text-blue-400'}`}>({conteoCompletadas})</span>
          </button>
          {conteoPendientes > 0 && (
            <button
              onClick={() => setFiltroEstado('Pendiente')}
              className={`flex items-center px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
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
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filtroEstado === 'Ausente'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            Ausentes <span className={`ml-1 font-normal ${filtroEstado === 'Ausente' ? 'text-white/90' : 'text-rose-600 dark:text-rose-400'}`}>({conteoAusentes})</span>
          </button>
          <button
            onClick={() => setFiltroEstado('Cancelada')}
            className={`flex items-center px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
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

      {/* Tabla y tarjetas */}
      <TablaGestionReservas
        reservas={reservasFiltradas}
        isLoading={isLoading}
        onAprobar={handleAprobarReserva}
        onAbrirRechazo={handleAbrirRechazo}
        onAbrirFuerzaMayor={handleAbrirFuerzaMayor}
      />

      {/* Modal Rechazar Reserva Pendiente */}
      <ModalRechazoReserva
        isOpen={isRechazarModalOpen}
        onClose={() => setIsRechazarModalOpen(false)}
        reserva={reservaARechazar}
        motivoRechazo={motivoRechazo}
        setMotivoRechazo={setMotivoRechazo}
        onSubmit={handleConfirmarRechazo}
        isSubmitting={isSubmittingRechazo}
      />

      {/* Modal Fuerza Mayor */}
      <ModalFuerzaMayor
        isOpen={isFuerzaMayorModalOpen}
        onClose={() => setIsFuerzaMayorModalOpen(false)}
        reserva={reservaAFuerzaMayor}
        motivoFuerzaMayor={motivoFuerzaMayor}
        setMotivoFuerzaMayor={setMotivoFuerzaMayor}
        onSubmit={handleConfirmarFuerzaMayor}
        isSubmitting={isSubmittingFuerzaMayor}
      />
    </div>
  );
}