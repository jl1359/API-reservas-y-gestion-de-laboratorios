import React, { useState, useEffect } from 'react';
import { Server, X, Check, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../api/client';

export interface EquipamientoBase {
  id: number;
  nombre: string;
  tipo?: string;
}

export interface LabEquipo {
  equipamiento: EquipamientoBase;
  cantidad: number;
}

interface ModalEquipamientoLabProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLabId: number | null;
  selectedLabName: string;
  onLabUpdated: () => void;
}

export default function ModalEquipamientoLab({
  isOpen,
  onClose,
  selectedLabId,
  selectedLabName,
  onLabUpdated
}: ModalEquipamientoLabProps) {
  const [equiposBase, setEquiposBase] = useState<EquipamientoBase[]>([]);
  const [currentLabEquipos, setCurrentLabEquipos] = useState<LabEquipo[]>([]);
  const [equipForm, setEquipForm] = useState({ equipamientoId: '', cantidad: '1' });
  const [isEquipLoading, setIsEquipLoading] = useState(false);
  const [mostrarCrearEquip, setMostrarCrearEquip] = useState(false);
  const [nuevoEquipNombre, setNuevoEquipNombre] = useState('');
  const [guardandoEquipBase, setGuardandoEquipBase] = useState(false);
  const [editingEquipId, setEditingEquipId] = useState<number | null>(null);
  const [editingCantidad, setEditingCantidad] = useState<string>('1');

  const loadEquipData = async (labId: number) => {
    try {
      setIsEquipLoading(true);
      const resBase = await apiClient.get('/api/equipamientos');
      const dataBase = Array.isArray(resBase.data) ? resBase.data : (resBase.data?.data || []);
      setEquiposBase(dataBase);

      const resLab = await apiClient.get(`/api/laboratorios/${labId}`);
      setCurrentLabEquipos(resLab.data?.data?.equipos || resLab.data?.equipos || []);
    } catch (error) {
      toast.error('Error al cargar equipamiento');
    } finally {
      setIsEquipLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedLabId) {
      loadEquipData(selectedLabId);
      setEquipForm({ equipamientoId: '', cantidad: '1' });
      setMostrarCrearEquip(false);
      setEditingEquipId(null);
    }
  }, [isOpen, selectedLabId]);

  if (!isOpen) return null;

  const handleCrearEquipamientoBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEquipNombre.trim()) {
      return toast.error('Ingresa un nombre para el nuevo equipamiento');
    }
    try {
      setGuardandoEquipBase(true);
      const res = await apiClient.post('/api/equipamientos', {
        nombre: nuevoEquipNombre.trim(),
        tipo: 'General'
      });
      toast.success(`"${nuevoEquipNombre.trim()}" registrado en el catálogo`);
      setNuevoEquipNombre('');
      setMostrarCrearEquip(false);

      const resBase = await apiClient.get('/api/equipamientos');
      const dataBase = Array.isArray(resBase.data) ? resBase.data : (resBase.data?.data || []);
      setEquiposBase(dataBase);

      if (res.data?.data?.id || res.data?.id) {
        const nuevoId = res.data?.data?.id || res.data?.id;
        setEquipForm(prev => ({ ...prev, equipamientoId: String(nuevoId) }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al registrar equipamiento');
    } finally {
      setGuardandoEquipBase(false);
    }
  };

  const handleAddEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId) return;
    try {
      await apiClient.post(`/api/equipamientos/laboratorio/${selectedLabId}`, {
        equipamientoId: Number(equipForm.equipamientoId),
        cantidad: Number(equipForm.cantidad)
      });
      toast.success('Equipamiento asignado al laboratorio');
      setEquipForm({ equipamientoId: '', cantidad: '1' });
      await loadEquipData(selectedLabId);
      onLabUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al vincular equipamiento');
    }
  };

  const handleStartEditEquip = (eq: LabEquipo) => {
    setEditingEquipId(eq.equipamiento.id);
    setEditingCantidad(String(eq.cantidad));
  };

  const handleCancelEditEquip = () => {
    setEditingEquipId(null);
    setEditingCantidad('1');
  };

  const handleGuardarEditEquip = async (equipId: number) => {
    if (!selectedLabId) return;
    const cantNum = Number(editingCantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      return toast.error('La cantidad debe ser mayor a 0');
    }
    try {
      await apiClient.put(`/api/equipamientos/laboratorio/${selectedLabId}/${equipId}`, {
        cantidad: cantNum
      });
      toast.success('Cantidad actualizada');
      setEditingEquipId(null);
      await loadEquipData(selectedLabId);
      onLabUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar cantidad');
    }
  };

  const handleEliminarEquip = async (equipId: number, nombreEquip: string) => {
    if (!selectedLabId) return;
    if (!window.confirm(`¿Confirmas retirar "${nombreEquip}" de este laboratorio?`)) return;
    try {
      await apiClient.delete(`/api/equipamientos/laboratorio/${selectedLabId}/${equipId}`);
      toast.success(`"${nombreEquip}" retirado del laboratorio`);
      await loadEquipData(selectedLabId);
      onLabUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al retirar equipamiento');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <Server className="w-5 h-5 mr-2 text-tech-blue" /> Equipamiento
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestionando: {selectedLabName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {isEquipLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white">Asignar Equipo al Laboratorio</h3>
                  <button
                    type="button"
                    onClick={() => setMostrarCrearEquip(!mostrarCrearEquip)}
                    className="text-xs font-semibold px-2.5 py-1 bg-tech-blue/10 hover:bg-tech-blue/20 text-tech-blue rounded-lg transition-colors"
                  >
                    {mostrarCrearEquip ? 'Cerrar' : '+ Registrar nuevo equipo'}
                  </button>
                </div>

                {mostrarCrearEquip && (
                  <form onSubmit={handleCrearEquipamientoBase} className="mb-4 p-3 bg-blue-50/60 dark:bg-slate-900/80 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Nuevo nombre de equipamiento</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del equipamiento (ej. Microscopio, Impresora 3D)"
                        value={nuevoEquipNombre}
                        onChange={(e) => setNuevoEquipNombre(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={guardandoEquipBase}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {guardandoEquipBase ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                )}

                <form onSubmit={handleAddEquip} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Equipamiento
                    </label>
                    <select
                      required
                      value={equipForm.equipamientoId}
                      onChange={(e) => setEquipForm({ ...equipForm, equipamientoId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                    >
                      <option value="" disabled>Seleccione un equipo...</option>
                      {equiposBase.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={equipForm.cantidad}
                      onChange={(e) => setEquipForm({ ...equipForm, cantidad: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Vincular al Laboratorio
                  </button>
                </form>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                  Inventario Actual ({currentLabEquipos.length})
                </h3>
                {currentLabEquipos.length > 0 ? (
                  <ul className="space-y-3">
                    {currentLabEquipos.map((eq) => {
                      const isEditing = editingEquipId === eq.equipamiento.id;
                      return (
                        <li
                          key={eq.equipamiento.id}
                          className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {eq.equipamiento.nombre}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {isEditing ? (
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={editingCantidad}
                                  onChange={(e) => setEditingCantidad(e.target.value)}
                                  className="w-16 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-bold text-center outline-none focus:ring-2 focus:ring-tech-blue"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleGuardarEditEquip(eq.equipamiento.id)}
                                  title="Guardar cantidad"
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditEquip}
                                  title="Cancelar edición"
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="bg-umss-blue text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                                  x{eq.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditEquip(eq)}
                                  title="Modificar cantidad"
                                  className="p-1.5 text-slate-400 hover:text-tech-blue dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEliminarEquip(eq.equipamiento.id, eq.equipamiento.nombre)}
                                  title="Retirar equipamiento del laboratorio"
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No hay equipos asignados a este laboratorio.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}