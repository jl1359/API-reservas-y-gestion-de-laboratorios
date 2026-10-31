import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Server,
  Clock,
  Box
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { laboratoriosApi } from '../../api/laboratorios.api';
import ModalLaboratorioForm, { type LaboratorioFormData } from './laboratorios/ModalLaboratorioForm';
import ModalEquipamientoLab from './laboratorios/ModalEquipamientoLab';
import ModalHorariosLab, { type DiaSchedule, mapearHorariosApiASchedule, defaultSchedule } from './laboratorios/ModalHorariosLab';

interface Carrera {
  id: number;
  nombre: string;
}

export interface LaboratorioAdminItem {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string | null;
  latitud?: number | null;
  longitud?: number | null;
  estadoOperativo: string;
  reservaPorComputadora: boolean;
  carreraId: number | null;
  carrera?: Carrera | null;
  imagenUrl?: string | null;
}

interface TabLaboratoriosProps {
  laboratorios: LaboratorioAdminItem[];
  carreras: Carrera[];
  isLoading: boolean;
  onRefresh: () => void;
}



export default function TabLaboratorios({
  laboratorios,
  carreras,
  isLoading,
  onRefresh
}: TabLaboratoriosProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<LaboratorioFormData>({
    nombre: '',
    capacidad: '',
    ubicacion: '',
    latitud: '',
    longitud: '',
    carreraId: '',
    reservaPorComputadora: false,
    estadoOperativo: 'Activo',
    imagenUrl: ''
  });

  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [selectedLabName, setSelectedLabName] = useState('');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<DiaSchedule[]>(defaultSchedule);

  const handleCambiarEstadoOperativo = async (labId: number, nuevoEstado: 'Activo' | 'Mantenimiento' | 'Inactivo') => {
    try {
      await laboratoriosApi.cambiarEstadoOperativo(labId, nuevoEstado);
      toast.success(`Estado operativo actualizado a "${nuevoEstado}"`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleOpenCreate = () => {
    setModalMode('crear');
    setEditingId(null);
    setFormData({
      nombre: '',
      capacidad: '',
      ubicacion: '',
      latitud: '',
      longitud: '',
      carreraId: '',
      reservaPorComputadora: false,
      estadoOperativo: 'Activo',
      imagenUrl: ''
    });
    setScheduleForm([...defaultSchedule]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lab: LaboratorioAdminItem) => {
    setModalMode('editar');
    setEditingId(lab.id);
    setFormData({
      nombre: lab.nombre,
      capacidad: lab.capacidad.toString(),
      ubicacion: lab.ubicacion || '',
      latitud: (lab as any).latitud ? String((lab as any).latitud) : '',
      longitud: (lab as any).longitud ? String((lab as any).longitud) : '',
      carreraId: lab.carreraId ? lab.carreraId.toString() : '',
      reservaPorComputadora: lab.reservaPorComputadora,
      estadoOperativo: lab.estadoOperativo || 'Activo',
      imagenUrl: lab.imagenUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return toast.error('El nombre del laboratorio es obligatorio');
    const capNum = Number(formData.capacidad);
    if (isNaN(capNum) || capNum <= 0) return toast.error('La capacidad debe ser un número positivo mayor a cero');

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        capacidad: capNum,
        ubicacion: formData.ubicacion.trim(),
        latitud: formData.latitud ? Number(formData.latitud) : null,
        longitud: formData.longitud ? Number(formData.longitud) : null,
        carreraId: formData.carreraId ? Number(formData.carreraId) : null,
        reservaPorComputadora: formData.reservaPorComputadora,
        estadoOperativo: formData.estadoOperativo,
        imagenUrl: formData.imagenUrl.trim() ? formData.imagenUrl.trim() : null,
        horarios: modalMode === 'crear' ? scheduleForm : undefined
      };

      if (modalMode === 'crear') {
        await apiClient.post('/api/laboratorios', payload);
        toast.success('Laboratorio creado con éxito');
      } else {
        await apiClient.put(`/api/laboratorios/${editingId}`, payload);
        toast.success('Laboratorio modificado exitosamente');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || `Error al ${modalMode === 'crear' ? 'crear' : 'actualizar'} el laboratorio`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de dar de baja este laboratorio?')) return;
    try {
      await apiClient.delete(`/api/laboratorios/${id}`);
      toast.success('Laboratorio eliminado correctamente');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'No se pudo eliminar el laboratorio');
    }
  };

  const handleOpenEquip = (lab: LaboratorioAdminItem) => {
    setSelectedLabId(lab.id);
    setSelectedLabName(lab.nombre);
    setIsEquipModalOpen(true);
  };

  const handleOpenSchedule = async (lab: LaboratorioAdminItem) => {
    setSelectedLabId(lab.id);
    setSelectedLabName(lab.nombre);
    setScheduleForm([...defaultSchedule]);
    setIsScheduleModalOpen(true);
    try {
      const res = await apiClient.get(`/api/laboratorios/${lab.id}/calendario`);
      if (res.data?.horarios) {
        setScheduleForm(mapearHorariosApiASchedule(res.data.horarios, defaultSchedule));
      }
    } catch {
      // Mantiene el horario por defecto si no pudo cargar
    }
  };

  const handleToggleDay = (index: number) => {
    const newSchedule = [...scheduleForm];
    newSchedule[index].activo = !newSchedule[index].activo;
    setScheduleForm(newSchedule);
  };

  const handleChangeTime = (index: number, field: 'horaApertura' | 'horaCierre', value: string) => {
    const newSchedule = [...scheduleForm];
    newSchedule[index][field] = value;
    setScheduleForm(newSchedule);
  };

  const handleSaveSchedule = async () => {
    if (!selectedLabId) return;
    const payload = scheduleForm
      .filter((d) => d.activo)
      .map((d) => ({ dia: d.dia, horaApertura: d.horaApertura, horaCierre: d.horaCierre }));
    if (payload.length === 0) return toast.error('Debes habilitar al menos un día');
    try {
      await apiClient.post(`/api/laboratorios/${selectedLabId}/horarios`, { horarios: payload });
      toast.success('Horarios configurados exitosamente');
      setIsScheduleModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar horarios');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Laboratorio
        </button>
      </div>

      {/* Vista de Tabla para Escritorio y Tablets Grandes */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-heading border-b border-slate-150 dark:border-slate-800 text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 font-bold">Laboratorio</th>
                <th className="px-6 py-4 font-bold">Capacidad</th>
                <th className="px-6 py-4 font-bold">Modalidad</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : laboratorios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No hay laboratorios registrados
                  </td>
                </tr>
              ) : (
                laboratorios.map((lab) => (
                  <tr
                    key={lab.id}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {lab.imagenUrl ? (
                          <img
                            src={lab.imagenUrl}
                            alt={lab.nombre}
                            className="w-10 h-10 object-cover rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            <Server className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{lab.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {lab.ubicacion || 'Sin ubicación'} • {lab.carrera?.nombre || 'General'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{lab.capacidad} Asientos</td>
                    <td className="px-6 py-4 font-medium">{lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={
                          lab.estadoOperativo === 'En Mantenimiento'
                            ? 'Mantenimiento'
                            : lab.estadoOperativo || 'Activo'
                        }
                        onChange={(e) => handleCambiarEstadoOperativo(lab.id, e.target.value as any)}
                        className={`text-xs font-semibold rounded-xl px-2.5 py-1.5 border transition-colors outline-none cursor-pointer ${
                          lab.estadoOperativo === 'En Mantenimiento' || lab.estadoOperativo === 'Mantenimiento'
                            ? 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : lab.estadoOperativo === 'Inactivo'
                            ? 'bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        }`}
                        title="Cambiar estado operativo inmediatamente"
                      >
                        <option value="Activo" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Activo</option>
                        <option value="Mantenimiento" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Mantenimiento</option>
                        <option value="Inactivo" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Inactivo</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenSchedule(lab)}
                          title="Horarios"
                          className="p-2 text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98]"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEquip(lab)}
                          title="Equipamiento"
                          className="p-2 text-slate-500 hover:text-amber-600 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98]"
                        >
                          <Box className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(lab)}
                          title="Editar"
                          className="p-2 text-slate-500 hover:text-tech-blue transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lab.id)}
                          title="Eliminar"
                          className="p-2 text-slate-500 hover:text-rose-600 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de Tarjetas Móvil (Smartphones y Tablets en Modo Vertical) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
          </div>
        ) : laboratorios.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-slate-500 text-sm">
            No hay laboratorios registrados
          </div>
        ) : (
          laboratorios.map((lab) => (
            <div
              key={lab.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {lab.imagenUrl ? (
                    <img
                      src={lab.imagenUrl}
                      alt={lab.nombre}
                      className="w-12 h-12 object-cover rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Server className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm truncate">
                      {lab.nombre}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {lab.ubicacion || 'Sin ubicación'} • {lab.carrera?.nombre || 'General'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {lab.capacidad} Asientos
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-tech-blue dark:text-blue-400">
                  {lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}
                </span>
                <div className="flex-1 min-w-[130px]">
                  <select
                    value={
                      lab.estadoOperativo === 'En Mantenimiento'
                        ? 'Mantenimiento'
                        : lab.estadoOperativo || 'Activo'
                    }
                    onChange={(e) => handleCambiarEstadoOperativo(lab.id, e.target.value as any)}
                    className={`w-full text-xs font-semibold rounded-xl px-2.5 py-1.5 border transition-colors outline-none cursor-pointer ${
                      lab.estadoOperativo === 'En Mantenimiento' || lab.estadoOperativo === 'Mantenimiento'
                        ? 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : lab.estadoOperativo === 'Inactivo'
                        ? 'bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <option value="Activo" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Activo</option>
                    <option value="Mantenimiento" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Mantenimiento</option>
                    <option value="Inactivo" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Botonera de acciones rápida táctil */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
                <button
                  onClick={() => handleOpenSchedule(lab)}
                  className="py-2.5 flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 transition-all active:scale-[0.98]"
                  title="Horarios"
                >
                  <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mb-1" />
                  <span className="text-[10px] font-semibold">Horarios</span>
                </button>
                <button
                  onClick={() => handleOpenEquip(lab)}
                  className="py-2.5 flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 transition-all active:scale-[0.98]"
                  title="Equipamiento"
                >
                  <Box className="w-4 h-4 text-amber-500 dark:text-amber-400 mb-1" />
                  <span className="text-[10px] font-semibold">Equipos</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(lab)}
                  className="py-2.5 flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 transition-all active:scale-[0.98]"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4 text-tech-blue dark:text-blue-400 mb-1" />
                  <span className="text-[10px] font-semibold">Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(lab.id)}
                  className="py-2.5 flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 transition-all active:scale-[0.98]"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400 mb-1" />
                  <span className="text-[10px] font-semibold">Baja</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear / Editar */}
      <ModalLaboratorioForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalMode={modalMode}
        formData={formData}
        setFormData={setFormData}
        carreras={carreras}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        onSubmit={handleSubmit}
      />

      {/* Modal Equipamiento */}
      <ModalEquipamientoLab
        isOpen={isEquipModalOpen}
        onClose={() => setIsEquipModalOpen(false)}
        selectedLabId={selectedLabId}
        selectedLabName={selectedLabName}
        onLabUpdated={onRefresh}
      />

      {/* Modal Horarios */}
      <ModalHorariosLab
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        selectedLabName={selectedLabName}
        scheduleForm={scheduleForm}
        onToggleDay={handleToggleDay}
        onChangeTime={handleChangeTime}
        onSaveSchedule={handleSaveSchedule}
      />
    </div>
  );
}