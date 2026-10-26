import { useState } from 'react';
import { Plus, Calendar, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { feriadosApi } from '../../api/feriados.api';
import type { Feriado as FeriadoItem } from '../../types';

interface TabFeriadosProps {
  feriadosList: FeriadoItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TabFeriados({ feriadosList, isLoading, onRefresh }: TabFeriadosProps) {
  const [isFeriadoModalOpen, setIsFeriadoModalOpen] = useState(false);
  const [feriadoForm, setFeriadoForm] = useState({ fecha: '', motivo: '' });
  const [isSubmittingFeriado, setIsSubmittingFeriado] = useState(false);

  const handleCrearFeriado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feriadoForm.fecha || !feriadoForm.motivo.trim()) {
      return toast.error('La fecha y el motivo institucional son obligatorios');
    }
    setIsSubmittingFeriado(true);
    try {
      await feriadosApi.crear({
        fecha: feriadoForm.fecha,
        motivo: feriadoForm.motivo.trim()
      });
      toast.success('Feriado o día bloqueado registrado correctamente');
      setIsFeriadoModalOpen(false);
      setFeriadoForm({ fecha: '', motivo: '' });
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar feriado');
    } finally {
      setIsSubmittingFeriado(false);
    }
  };

  const handleEliminarFeriado = async (id: number, motivo: string) => {
    if (!window.confirm(`¿Confirmas eliminar el bloqueo de "${motivo}"? Los docentes podrán volver a reservar en esa fecha.`)) {
      return;
    }
    try {
      await feriadosApi.eliminar(id);
      toast.success('Restricción anulada. El día fue reabierto en el calendario');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar restricción');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-tech-blue" />
            Calendario de Feriados y Días Bloqueados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Días no laborables sin disponibilidad de reservas.
          </p>
        </div>
        <button
          onClick={() => { setFeriadoForm({ fecha: '', motivo: '' }); setIsFeriadoModalOpen(true); }}
          className="inline-flex items-center bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Feriado / Bloqueo
        </button>
      </div>

      {/* Vista de Escritorio / Tablet Grande (Tabla con ancho mínimo protegido) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 min-w-[650px]">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading border-b border-slate-150 dark:border-slate-800 text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 font-bold">Fecha Restringida</th>
                <th className="px-6 py-4 font-bold">Motivo Institucional</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : feriadosList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No hay feriados o días bloqueados configurados
                  </td>
                </tr>
              ) : (
                feriadosList.map((f) => {
                  const fechaObj = new Date(f.fecha);
                  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
                    timeZone: 'UTC',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  return (
                    <tr key={f.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white capitalize flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-rose-500" />
                          {fechaFormateada}
                        </p>
                        <span className="text-xs font-mono text-slate-400">{f.fecha.split('T')[0]}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{f.motivo}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          f.bloqueoActivo
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {f.bloqueoActivo ? 'Bloqueo Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEliminarFeriado(f.id, f.motivo)}
                          title="Anular restricción y reabrir fecha"
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
        ) : feriadosList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 text-slate-500 text-sm">
            No hay feriados o días bloqueados configurados
          </div>
        ) : (
          feriadosList.map((f) => {
            const fechaObj = new Date(f.fecha);
            const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
              timeZone: 'UTC',
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div
                key={f.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white capitalize text-sm flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-rose-500 shrink-0" />
                      {fechaFormateada}
                    </p>
                    <span className="text-[11px] font-mono text-slate-400">{f.fecha.split('T')[0]}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    f.bloqueoActivo
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {f.bloqueoActivo ? 'Bloqueo Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-150 dark:border-slate-700/60 text-xs">
                  <p className="text-slate-400 text-[11px] font-medium mb-0.5">Motivo Institucional:</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{f.motivo}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleEliminarFeriado(f.id, f.motivo)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Anular Restricción</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Feriado */}
      {isFeriadoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto my-auto animate-fadeIn border border-slate-200/80 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/60">
              <h3 className="font-heading font-bold text-slate-900 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-tech-blue" />
                Registrar Feriado o Cierre
              </h3>
              <button onClick={() => setIsFeriadoModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearFeriado} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Fecha a Bloquear *
                </label>
                <input
                  type="date"
                  required
                  value={feriadoForm.fecha}
                  onChange={(e) => setFeriadoForm({ ...feriadoForm, fecha: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-tech-blue text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Motivo Institucional / Causa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aniversario UMSS, Feriado Nacional, Fumigación"
                  maxLength={150}
                  value={feriadoForm.motivo}
                  onChange={(e) => setFeriadoForm({ ...feriadoForm, motivo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-tech-blue text-sm"
                />
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                Al guardar, los intentos de reserva que coincidan con este día serán bloqueados automáticamente.
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeriadoModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeriado}
                  className="px-5 py-2 bg-tech-blue hover:bg-blue-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
                >
                  {isSubmittingFeriado ? 'Guardando...' : 'Aplicar Bloqueo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
