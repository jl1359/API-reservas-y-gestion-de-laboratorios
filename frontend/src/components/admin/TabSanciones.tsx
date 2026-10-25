import { useState } from 'react';
import { Ban, Clock, Plus, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { sancionesApi } from '../../api/sanciones.api';
import type { Sancion, Usuario } from '../../types';

interface TabSancionesProps {
  sancionesList: Sancion[];
  usuariosList: Usuario[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TabSanciones({
  sancionesList,
  usuariosList,
  isLoading,
  onRefresh
}: TabSancionesProps) {
  const [filtroEstadoSancion, setFiltroEstadoSancion] = useState<'Todas' | 'Activa' | 'Expirada' | 'Perdonada'>('Todas');

  // Modal Sanción Manual
  const [isManualSancionModalOpen, setIsManualSancionModalOpen] = useState(false);
  const [manualSancionForm, setManualSancionForm] = useState({ usuarioId: '', horasDuracion: '24', motivo: '' });
  const [isSubmittingManualSancion, setIsSubmittingManualSancion] = useState(false);

  // Modal Perdonar Sanción
  const [isPerdonarModalOpen, setIsPerdonarModalOpen] = useState(false);
  const [sancionAPerdonar, setSancionAPerdonar] = useState<Sancion | null>(null);
  const [motivoPerdon, setMotivoPerdon] = useState('');
  const [isSubmittingPerdon, setIsSubmittingPerdon] = useState(false);

  // Proceso de barrido automático
  const [isProcesandoInasistencias, setIsProcesandoInasistencias] = useState(false);

  const handleEjecutarInasistencias = async () => {
    setIsProcesandoInasistencias(true);
    try {
      const res = await sancionesApi.procesarInasistencias();
      toast.success(res.mensaje || 'Barrido de inasistencias ejecutado');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al procesar inasistencias');
    } finally {
      setIsProcesandoInasistencias(false);
    }
  };

  const handleCrearSancionManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSancionForm.usuarioId || !manualSancionForm.motivo.trim()) {
      return toast.error('El usuario y la justificación son obligatorios');
    }

    setIsSubmittingManualSancion(true);
    try {
      await sancionesApi.crearSancionManual({
        usuarioId: Number(manualSancionForm.usuarioId),
        motivo: manualSancionForm.motivo.trim(),
        horasDuracion: Number(manualSancionForm.horasDuracion) || 24
      });
      toast.success('Sanción disciplinaria aplicada exitosamente');
      setIsManualSancionModalOpen(false);
      setManualSancionForm({ usuarioId: '', horasDuracion: '24', motivo: '' });
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al aplicar sanción');
    } finally {
      setIsSubmittingManualSancion(false);
    }
  };

  const handleAbrirPerdonar = (sancion: Sancion) => {
    setSancionAPerdonar(sancion);
    setMotivoPerdon('');
    setIsPerdonarModalOpen(true);
  };

  const handleConfirmarPerdonar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sancionAPerdonar) return;
    setIsSubmittingPerdon(true);
    try {
      await sancionesApi.perdonarSancion(sancionAPerdonar.id, motivoPerdon.trim() || undefined);
      toast.success(`Sanción levantada para ${sancionAPerdonar.usuario?.nombreCompleto || 'Usuario'}`);
      setIsPerdonarModalOpen(false);
      setSancionAPerdonar(null);
      setMotivoPerdon('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al perdonar sanción');
    } finally {
      setIsSubmittingPerdon(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
            <Ban className="w-5 h-5 mr-2 text-rose-600" />
            Régimen Disciplinario y Sanciones
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión y levantamiento de sanciones por inasistencia.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleEjecutarInasistencias}
            disabled={isProcesandoInasistencias}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center shadow-xs active:scale-[0.98] disabled:opacity-50"
            title="Detectar reservas sin check-in tras el tiempo de tolerancia y suspender por 24 horas"
          >
            <Clock className="w-4 h-4 mr-1.5 text-amber-500" />
            {isProcesandoInasistencias ? 'Procesando...' : 'Barrer Inasistencias'}
          </button>
          <button
            onClick={() => {
              setManualSancionForm({ usuarioId: '', horasDuracion: '24', motivo: '' });
              setIsManualSancionModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all flex items-center shadow-sm shadow-rose-600/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Aplicar Sanción Manual
          </button>
        </div>
      </div>

      {/* Filtros rápidos de estado */}
      <div className="flex flex-wrap items-center gap-2">
        {(['Todas', 'Activa', 'Perdonada', 'Expirada'] as const).map((est) => {
          const cant = est === 'Todas' ? sancionesList.length : sancionesList.filter((s) => s.estado === est).length;
          return (
            <button
              key={est}
              onClick={() => setFiltroEstadoSancion(est)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                filtroEstadoSancion === est
                  ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {est} ({cant})
            </button>
          );
        })}
      </div>

      {/* Vista de Escritorio / Tablet Grande (Tabla con ancho mínimo protegido) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 min-w-[760px]">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading border-b border-slate-150 dark:border-slate-800 text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 font-bold">Usuario Sancionado</th>
                <th className="px-6 py-4 font-bold">Causa / Justificación</th>
                <th className="px-6 py-4 font-bold">Período de Penalización</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : (
                sancionesList
                  .filter((s) => filtroEstadoSancion === 'Todas' || s.estado === filtroEstadoSancion)
                  .map((s) => {
                    const inicio = new Date(s.fechaInicio);
                    const fin = new Date(s.fechaFin);
                    const ahora = new Date();
                    const activaReal = s.estado === 'Activa' && ahora < fin;

                    return (
                      <tr
                        key={s.id}
                        className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-white">{s.usuario?.nombreCompleto || 'Usuario'}</p>
                          <p className="text-xs text-slate-500">{s.usuario?.correo}</p>
                          {s.reserva?.laboratorio && (
                            <p className="text-[11px] text-tech-blue dark:text-blue-400 mt-0.5">
                              Reserva: {s.reserva.laboratorio.nombre}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={s.motivo}>
                          {s.motivo}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            Desde: {inicio.toLocaleDateString('es-ES')}{' '}
                            {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-slate-500">
                            Hasta: {fin.toLocaleDateString('es-ES')}{' '}
                            {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              s.estado === 'Activa' && activaReal
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                : s.estado === 'Perdonada'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {s.estado === 'Activa' && activaReal ? 'Activa' : s.estado === 'Perdonada' ? 'Perdonada' : 'Expirada'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {s.estado === 'Activa' && activaReal ? (
                            <button
                              onClick={() => handleAbrirPerdonar(s)}
                              className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 rounded-xl transition shadow-xs"
                              title="Levantar sanción y restaurar privilegios de reserva"
                            >
                              Levantar Sanción
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin acciones</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
              {!isLoading &&
                sancionesList.filter((s) => filtroEstadoSancion === 'Todas' || s.estado === filtroEstadoSancion).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron sanciones registradas en este estado
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Móvil / Tablet Pequeña (Tarjetas Táctiles) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
          </div>
        ) : sancionesList.filter((s) => filtroEstadoSancion === 'Todas' || s.estado === filtroEstadoSancion).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 text-slate-500 text-sm">
            No se encontraron sanciones registradas en este estado
          </div>
        ) : (
          sancionesList
            .filter((s) => filtroEstadoSancion === 'Todas' || s.estado === filtroEstadoSancion)
            .map((s) => {
              const inicio = new Date(s.fechaInicio);
              const fin = new Date(s.fechaFin);
              const ahora = new Date();
              const activaReal = s.estado === 'Activa' && ahora < fin;

              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {s.usuario?.nombreCompleto || 'Usuario'}
                      </h4>
                      <p className="text-xs text-slate-500">{s.usuario?.correo}</p>
                      {s.reserva?.laboratorio && (
                        <p className="text-[11px] text-tech-blue dark:text-blue-400 mt-0.5">
                          Reserva: {s.reserva.laboratorio.nombre}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        s.estado === 'Activa' && activaReal
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : s.estado === 'Perdonada'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {s.estado === 'Activa' && activaReal ? 'Activa' : s.estado === 'Perdonada' ? 'Perdonada' : 'Expirada'}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-150 dark:border-slate-700/60 text-xs space-y-1">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Causa: </span>
                      {s.motivo}
                    </p>
                    <div className="pt-1 flex flex-col sm:flex-row sm:justify-between text-[11px] text-slate-500 gap-0.5">
                      <span>Desde: {inicio.toLocaleDateString('es-ES')} {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>Hasta: {fin.toLocaleDateString('es-ES')} {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {s.estado === 'Activa' && activaReal && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleAbrirPerdonar(s)}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Levantar Sanción</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Modal Sanción Manual */}
      {isManualSancionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <Ban className="w-5 h-5 mr-2 text-rose-600" />
                Aplicar Sanción Manual
              </h2>
              <button onClick={() => setIsManualSancionModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearSancionManual} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Usuario a Sancionar <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={manualSancionForm.usuarioId}
                  onChange={(e) => setManualSancionForm({ ...manualSancionForm, usuarioId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none dark:text-white"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Seleccione un usuario...</option>
                  {usuariosList.map((u) => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {u.nombreCompleto} ({u.correo}) - {typeof u.rol === 'object' ? u.rol?.nombre : u.rol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duración de la Suspensión (Horas) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  required
                  value={manualSancionForm.horasDuracion}
                  onChange={(e) => setManualSancionForm({ ...manualSancionForm, horasDuracion: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none dark:text-white"
                  placeholder="24"
                />
                <p className="text-[11px] text-slate-400 mt-1">De 1 a 720 horas (máx. 30 días).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Falta Disciplinaria <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualSancionForm.motivo}
                  onChange={(e) => setManualSancionForm({ ...manualSancionForm, motivo: e.target.value })}
                  placeholder="Detalla el motivo institucional..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsManualSancionModalOpen(false)}
                  disabled={isSubmittingManualSancion}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManualSancion}
                  className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow transition flex items-center"
                >
                  {isSubmittingManualSancion ? 'Aplicando...' : 'Aplicar Sanción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Levantar Sanción */}
      {isPerdonarModalOpen && sancionAPerdonar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
                Levantar Sanción Disciplinaria
              </h2>
              <button onClick={() => setIsPerdonarModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarPerdonar} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <p><strong>Usuario:</strong> {sancionAPerdonar.usuario?.nombreCompleto}</p>
                <p><strong>Causa original:</strong> {sancionAPerdonar.motivo}</p>
                <p><strong>Vencimiento:</strong> {new Date(sancionAPerdonar.fechaFin).toLocaleString('es-ES')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justificación del Levantamiento (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={motivoPerdon}
                  onChange={(e) => setMotivoPerdon(e.target.value)}
                  placeholder="Ej. Presentó certificado médico en decanato, corte de energía en el laboratorio..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
                Al confirmar, el usuario recuperará inmediatamente el privilegio de solicitar y reservar laboratorios.
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsPerdonarModalOpen(false)}
                  disabled={isSubmittingPerdon}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPerdon}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow transition flex items-center"
                >
                  {isSubmittingPerdon ? 'Restableciendo...' : 'Confirmar Levantamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
