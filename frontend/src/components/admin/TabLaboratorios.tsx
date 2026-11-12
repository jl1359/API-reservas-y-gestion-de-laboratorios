import { useState, useMemo, useDeferredValue } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Server,
  Clock,
  Box,
  Search,
  MapPin,
  Users,
  LayoutGrid,
  Table as TableIcon,
  Monitor
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

  // Estados de diseño estilo Trivago
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Activo' | 'Mantenimiento' | 'Inactivo'>('todos');
  const [filtroCarreraId, setFiltroCarreraId] = useState<string>('todas');
  const [modoVisualizacion, setModoVisualizacion] = useState<'trivago' | 'tabla'>('trivago');

  // Búsqueda diferida concurrente para respuesta táctil instantánea
  const busquedaDiferida = useDeferredValue(busquedaTexto);

  // Filtrado reactivo en tiempo real estilo Trivago con alta prioridad de render
  const laboratoriosFiltrados = useMemo(() => {
    const query = busquedaDiferida.trim().toLowerCase();
    return laboratorios.filter((lab) => {
      const matchTexto = 
        !query ||
        lab.nombre.toLowerCase().includes(query) ||
        (lab.ubicacion && lab.ubicacion.toLowerCase().includes(query)) ||
        (lab.carrera?.nombre && lab.carrera.nombre.toLowerCase().includes(query));

      const estadoNormalizado = lab.estadoOperativo === 'En Mantenimiento' ? 'Mantenimiento' : lab.estadoOperativo || 'Activo';
      const matchEstado = filtroEstado === 'todos' || estadoNormalizado === filtroEstado;

      const matchCarrera = filtroCarreraId === 'todas' || String(lab.carreraId) === filtroCarreraId;

      return matchTexto && matchEstado && matchCarrera;
    });
  }, [laboratorios, busquedaDiferida, filtroEstado, filtroCarreraId]);

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
    setScheduleForm(defaultSchedule.map((d) => ({ ...d })));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lab: LaboratorioAdminItem) => {
    setModalMode('editar');
    setEditingId(lab.id);
    setFormData({
      nombre: lab.nombre,
      capacidad: String(lab.capacidad),
      ubicacion: lab.ubicacion || '',
      latitud: lab.latitud ? String(lab.latitud) : '',
      longitud: lab.longitud ? String(lab.longitud) : '',
      carreraId: lab.carreraId ? String(lab.carreraId) : '',
      reservaPorComputadora: lab.reservaPorComputadora,
      estadoOperativo: (lab.estadoOperativo as any) || 'Activo',
      imagenUrl: lab.imagenUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este laboratorio?')) return;
    try {
      await laboratoriosApi.eliminar(id);
      toast.success('Laboratorio eliminado');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: formData.nombre,
        capacidad: Number(formData.capacidad),
        ubicacion: formData.ubicacion || null,
        latitud: formData.latitud ? Number(formData.latitud) : null,
        longitud: formData.longitud ? Number(formData.longitud) : null,
        carreraId: formData.carreraId ? Number(formData.carreraId) : null,
        reservaPorComputadora: formData.reservaPorComputadora,
        estadoOperativo: formData.estadoOperativo,
        imagenUrl: formData.imagenUrl || null
      };

      if (modalMode === 'crear') {
        const payloadConHorarios = {
          ...payload,
          horarios: scheduleForm
            .filter((d) => d.activo)
            .map((d) => ({ dia: d.dia, horaApertura: d.horaApertura, horaCierre: d.horaCierre }))
        };
        await laboratoriosApi.crear(payloadConHorarios as any);
        toast.success('Laboratorio creado');
      } else if (editingId) {
        await laboratoriosApi.actualizar(editingId, payload);
        toast.success('Laboratorio actualizado');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar laboratorio');
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
    setScheduleForm(defaultSchedule.map((d) => ({ ...d })));
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
    setScheduleForm((prev) =>
      prev.map((d, i) => (i === index ? { ...d, activo: !d.activo } : d))
    );
  };

  const handleChangeTime = (index: number, field: 'horaApertura' | 'horaCierre', value: string) => {
    setScheduleForm((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
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
    <div className="space-y-6">
      {/* ========================================================
          BARRA DE CONTROL Y BÚSQUEDA MULTISEGMENTO ESTILO TRIVAGO
          ======================================================== */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-xl transition-all">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Segmento 1: Input de Búsqueda Rápida */}
          <div className="flex-1 relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Buscar laboratorio por nombre, ubicación o carrera..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-tech-blue focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>

          {/* Segmento 2: Selector de Carrera */}
          <div className="min-w-[190px]">
            <select
              value={filtroCarreraId}
              onChange={(e) => setFiltroCarreraId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-tech-blue shadow-inner cursor-pointer"
            >
              <option value="todas">Todas las Carreras</option>
              {carreras.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Segmento 3: Píldoras de Filtro Rápido (Estado) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filtroEstado === 'todos'
                  ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({laboratorios.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('Activo')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filtroEstado === 'Activo'
                  ? 'bg-emerald-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('Mantenimiento')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filtroEstado === 'Mantenimiento'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mantenimiento
            </button>
          </div>

          {/* Segmento 4: Toggle Modo Vista (Trivago Cards vs Tabla) + Botón Crear */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-150 dark:border-slate-800">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setModoVisualizacion('trivago')}
                title="Vista de Fichas Comparativas Trivago"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  modoVisualizacion === 'trivago'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacion('tabla')}
                title="Vista de Tabla Clásica"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  modoVisualizacion === 'tabla'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Nuevo Laboratorio</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          VISTA 1: FICHAS COMPARATIVAS ESTILO TRIVAGO (CARDS RICAS)
          ======================================================== */}
      {modoVisualizacion === 'trivago' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-blue mx-auto"></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-semibold">Cargando catálogo de laboratorios...</p>
            </div>
          ) : laboratoriosFiltrados.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-slate-500">
              <Server className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No se encontraron laboratorios</p>
              <p className="text-xs text-slate-500 mt-1">Prueba cambiando los términos de búsqueda o los filtros de carrera.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {laboratoriosFiltrados.map((lab) => {
                const estado = lab.estadoOperativo === 'En Mantenimiento' ? 'Mantenimiento' : lab.estadoOperativo || 'Activo';

                return (
                  <div
                    key={lab.id}
                    className="group bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 hover:border-tech-blue/40 dark:hover:border-blue-500/40 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch"
                  >
                    {/* Sección Izquierda: Imagen y Badges Estilo Trivago */}
                    <div className="relative md:w-64 h-48 md:h-auto bg-slate-100 dark:bg-slate-800/70 overflow-hidden flex-shrink-0">
                      {lab.imagenUrl ? (
                        <img
                          src={lab.imagenUrl}
                          alt={lab.nombre}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400">
                          <Monitor className="w-12 h-12 mb-1 text-slate-400/60" />
                          <span className="text-[11px] font-semibold">Laboratorio FCyT</span>
                        </div>
                      )}

                      {/* Gradiente de sombra inferior */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      {/* Badges Superiores Flotantes */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        {/* Estado Operativo */}
                        <span className={`inline-flex items-center text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                          estado === 'Activo'
                            ? 'bg-emerald-500 text-white'
                            : estado === 'Mantenimiento'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}>
                          <span>{estado === 'Activo' ? 'Operativo' : estado}</span>
                        </span>

                        {/* Modalidad */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md">
                          {lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}
                        </span>
                      </div>

                      {/* Capacidad inferior en la foto */}
                      <div className="absolute bottom-3 left-3 text-white text-xs font-bold drop-shadow-md flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        <span>{lab.capacidad} Asientos</span>
                      </div>
                    </div>

                    {/* Sección Central: Información Académica y Ubicación */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-tech-blue dark:text-blue-400 border border-blue-500/20">
                            {lab.carrera?.nombre || 'Uso Común FCyT'}
                          </span>
                          <span className="text-slate-400 text-xs">ID #{lab.id}</span>
                        </div>

                        <h3 className="font-heading font-extrabold text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-tech-blue transition-colors">
                          {lab.nombre}
                        </h3>

                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-tech-blue shrink-0" />
                          <span>{lab.ubicacion || 'Campus Central FCyT, UMSS'}</span>
                        </div>
                      </div>

                      {/* Botones de gestión rápida de recursos */}
                      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleOpenSchedule(lab)}
                          className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/70 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                          <span>Horarios Semanales</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEquip(lab)}
                          className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/70 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          <Box className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                          <span>Catálogo de Equipos</span>
                        </button>
                      </div>
                    </div>

                    {/* Sección Derecha: Trivago "Deal Box" / Selector de Estado y Acciones */}
                    <div className="p-5 md:w-56 bg-slate-50/70 dark:bg-slate-950/50 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Estado Operativo
                        </span>
                        <select
                          value={estado}
                          onChange={(e) => handleCambiarEstadoOperativo(lab.id, e.target.value as any)}
                          className={`w-full text-xs font-bold rounded-xl px-3 py-2 border transition-all outline-none cursor-pointer shadow-xs ${
                            estado === 'Mantenimiento'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : estado === 'Inactivo'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <option value="Activo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">● Activo</option>
                          <option value="Mantenimiento" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">▲ Mantenimiento</option>
                          <option value="Inactivo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">■ Inactivo</option>
                        </select>
                      </div>

                      {/* Acciones principales de edición */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(lab)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer shadow-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(lab.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer shadow-xs"
                          title="Eliminar laboratorio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
            VISTA 2: TABLA COMPACTA CLÁSICA (PRESIDIDA POR EL ADMIN)
            ======================================================== */
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
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
                ) : laboratoriosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No hay laboratorios que coincidan con los filtros
                    </td>
                  </tr>
                ) : (
                  laboratoriosFiltrados.map((lab) => (
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
                            className="p-2 text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98] cursor-pointer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEquip(lab)}
                            title="Equipamiento"
                            className="p-2 text-slate-500 hover:text-amber-600 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98] cursor-pointer"
                          >
                            <Box className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(lab)}
                            title="Editar"
                            className="p-2 text-slate-500 hover:text-tech-blue transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98] cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lab.id)}
                            title="Eliminar"
                            className="p-2 text-slate-500 hover:text-rose-600 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl active:scale-[0.98] cursor-pointer"
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
      )}

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
        onResetToUmss={() => setScheduleForm(defaultSchedule.map((d) => ({ ...d })))}
      />
    </div>
  );
}
