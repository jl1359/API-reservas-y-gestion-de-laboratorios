import { useState } from 'react';
import { Plus, Wrench, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { laboratoriosApi } from '../../api/laboratorios.api';
import type { Mantenimiento } from '../../types';

interface LaboratorioBasic {
  id: number;
  nombre: string;
  ubicacion: string | null;
}

interface TabMantenimientosProps {
  mantenimientosList: Mantenimiento[];
  laboratorios: LaboratorioBasic[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TabMantenimientos({
  mantenimientosList,
  laboratorios,
  isLoading,
  onRefresh
}: TabMantenimientosProps) {
  const [isMantenimientoModalOpen, setIsMantenimientoModalOpen] = useState(false);
  const [mantenimientoForm, setMantenimientoForm] = useState({
    laboratorioId: '',
    fechaInicio: '',
    fechaFin: '',
    motivo: ''
  });
  const [isSubmittingMantenimiento, setIsSubmittingMantenimiento] = useState(false);

  const handleCrearMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mantenimientoForm.laboratorioId || !mantenimientoForm.fechaInicio || !mantenimientoForm.fechaFin || !mantenimientoForm.motivo.trim()) {
      return toast.error('Todos los campos son obligatorios');
    }
    setIsSubmittingMantenimiento(true);
    try {
      await laboratoriosApi.registrarMantenimiento({
        laboratorioId: Number(mantenimientoForm.laboratorioId),
        fechaInicio: new Date(mantenimientoForm.fechaInicio).toISOString(),
        fechaFin: new Date(mantenimientoForm.fechaFin).toISOString(),
        motivo: mantenimientoForm.motivo.trim()
      });
      toast.success('Mantenimiento programado y reservas notificadas');
      setIsMantenimientoModalOpen(false);
      setMantenimientoForm({ laboratorioId: '', fechaInicio: '', fechaFin: '', motivo: '' });
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al programar mantenimiento');
    } finally {
      setIsSubmittingMantenimiento(false);
    }
  };

  const handleEliminarMantenimiento = async (id: number, nombreLab: string) => {
    if (!window.confirm(`¿Confirmas anular el mantenimiento para ${nombreLab}? El calendario quedará liberado.`)) return;
    try {
      await laboratoriosApi.eliminarMantenimiento(id);
      toast.success('Mantenimiento anulado y agenda liberada');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al anular mantenimiento');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-tech-blue" />
            Programación de Mantenimiento y Bloqueos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bloquea temporalmente el calendario de los laboratorios ante reparaciones preventivas o correctivas.
          </p>
        </div>
        <button
          onClick={() => {
            setMantenimientoForm({ laboratorioId: '', fechaInicio: '', fechaFin: '', motivo: '' });
            setIsMantenimientoModalOpen(true);
          }}
          className="bg-tech-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-sm transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Programar Mantenimiento
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">Laboratorio</th>
                <th className="px-6 py-4 font-bold">Período de Bloqueo</th>
                <th className="px-6 py-4 font-bold">Motivo / Causa</th>
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
              ) : mantenimientosList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No hay mantenimientos activos ni programados
                  </td>
                </tr>
              ) : (
                mantenimientosList.map((m) => {
                  const inicio = new Date(m.fechaInicio);
                  const fin = new Date(m.fechaFin);
                  const ahora = new Date();
                  const enCurso = ahora >= inicio && ahora <= fin;

                  return (
                    <tr key={m.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {m.laboratorio?.nombre || `Laboratorio #${m.laboratorioId}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.laboratorio?.ubicacion || 'Campus Central'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {inicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                          {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-500">
                          hasta {fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                          {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={m.motivo}>
                        {m.motivo}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          enCurso
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : ahora < inicio
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {enCurso ? 'En Curso' : ahora < inicio ? 'Programado' : 'Concluido'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEliminarMantenimiento(m.id, m.laboratorio?.nombre || 'este laboratorio')}
                          title="Anular mantenimiento y reabrir agenda"
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

      {/* Modal Programar Mantenimiento */}
      {isMantenimientoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-tech-blue" />
                Programar Mantenimiento
              </h2>
              <button onClick={() => setIsMantenimientoModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearMantenimiento} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Laboratorio <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={mantenimientoForm.laboratorioId}
                  onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, laboratorioId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue outline-none dark:text-white"
                >
                  <option value="" disabled>Seleccione un laboratorio...</option>
                  {laboratorios.map((lab) => (
                    <option key={lab.id} value={lab.id}>{lab.nombre} ({lab.ubicacion || 'General'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={mantenimientoForm.fechaInicio}
                    onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={mantenimientoForm.fechaFin}
                    onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, fechaFin: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue outline-none dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Tareas a Realizar <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={mantenimientoForm.motivo}
                  onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, motivo: e.target.value })}
                  placeholder="Ej. Mantenimiento de cableado de red, formateo preventivo, cambio de luminarias..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue outline-none dark:text-white resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                El sistema bloqueará automáticamente la creación de nuevas reservas durante esta ventana horaria.
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsMantenimientoModalOpen(false)}
                  disabled={isSubmittingMantenimiento}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMantenimiento}
                  className="px-5 py-2 text-sm font-bold text-white bg-tech-blue hover:bg-blue-600 disabled:opacity-50 rounded-xl shadow transition flex items-center"
                >
                  {isSubmittingMantenimiento ? 'Programando...' : 'Confirmar Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
