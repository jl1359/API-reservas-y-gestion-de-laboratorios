import { useState, useRef } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit2,
  Trash2,
  Server,
  Clock,
  Box,
  X,
  UploadCloud,
  CheckCircle2,
  MapPin,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { laboratoriosApi } from '../../api/laboratorios.api';

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

interface EquipamientoBase {
  id: number;
  nombre: string;
  tipo: string;
}

interface LabEquipo {
  cantidad: number;
  equipamiento: EquipamientoBase;
}

interface TabLaboratoriosProps {
  laboratorios: LaboratorioAdminItem[];
  carreras: Carrera[];
  isLoading: boolean;
  onRefresh: () => void;
}

const defaultSchedule = [
  { dia: 'Lunes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
  { dia: 'Martes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
  { dia: 'Miércoles', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
  { dia: 'Jueves', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
  { dia: 'Viernes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
  { dia: 'Sábado', activo: false, horaApertura: '08:00', horaCierre: '12:00' },
  { dia: 'Domingo', activo: false, horaApertura: '08:00', horaCierre: '12:00' }
];

const comprimirYConvertirABase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida (JPG, PNG, WebP)'));
    }

    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error('La imagen excede el límite máximo permitido de 15 MB'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo desde el dispositivo'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada'));
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(readerEvent.target?.result as string);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};


const FCYT_BUILDINGS = [
  { nombre: 'Edificio Central / Sistemas', lat: -17.393845, lng: -66.146210 },
  { nombre: 'Bloque de Informática', lat: -17.394010, lng: -66.146420 },
  { nombre: 'Edificio MEMI', lat: -17.393750, lng: -66.146150 },
  { nombre: 'Bloque de Química y Alimentos', lat: -17.394230, lng: -66.145810 },
  { nombre: 'Bloque de Física y Nuevas Aulas', lat: -17.393520, lng: -66.146820 }
];

export default function TabLaboratorios({
  laboratorios,
  carreras,
  isLoading,
  onRefresh
}: TabLaboratoriosProps) {
  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
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

  // Modal Equipamiento
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [selectedLabName, setSelectedLabName] = useState('');
  const [equiposBase, setEquiposBase] = useState<EquipamientoBase[]>([]);
  const [currentLabEquipos, setCurrentLabEquipos] = useState<LabEquipo[]>([]);
  const [equipForm, setEquipForm] = useState({ equipamientoId: '', cantidad: '1' });
  const [isEquipLoading, setIsEquipLoading] = useState(false);
  const [mostrarCrearEquip, setMostrarCrearEquip] = useState(false);
  const [nuevoEquipNombre, setNuevoEquipNombre] = useState('');
  const [guardandoEquipBase, setGuardandoEquipBase] = useState(false);
  const [editingEquipId, setEditingEquipId] = useState<number | null>(null);
  const [editingCantidad, setEditingCantidad] = useState<string>('1');

  // Modal Horarios
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(defaultSchedule);

  // Estado y gestores para subida de imagen desde dispositivo
  const [modoCargaImagen, setModoCargaImagen] = useState<'archivo' | 'url'>('archivo');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcesandoImagen, setIsProcesandoImagen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const procesarArchivoImagen = async (file: File) => {
    setIsProcesandoImagen(true);
    try {
      const dataUrl = await comprimirYConvertirABase64(file);
      setFormData((prev) => ({ ...prev, imagenUrl: dataUrl }));
      toast.success('Fotografía procesada y optimizada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo procesar la fotografía');
    } finally {
      setIsProcesandoImagen(false);
    }
  };

  
  const obtenerUbicacionGpsActual = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización GPS');
      return;
    }
    toast.loading('Detectando coordenadas GPS del campus...', { id: 'gps-detect' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitud: pos.coords.latitude.toFixed(6),
          longitud: pos.coords.longitude.toFixed(6)
        }));
        toast.success('Coordenadas capturadas exitosamente', { id: 'gps-detect' });
      },
      (err) => {
        toast.error('No se pudo obtener la ubicación GPS: ' + err.message, { id: 'gps-detect' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      procesarArchivoImagen(files[0]);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      procesarArchivoImagen(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

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
    setModoCargaImagen('archivo');
    setIsDragging(false);
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lab: LaboratorioAdminItem) => {
    setModalMode('editar');
    setEditingId(lab.id);
    setModoCargaImagen(lab.imagenUrl?.startsWith('data:') ? 'archivo' : (lab.imagenUrl ? 'url' : 'archivo'));
    setIsDragging(false);
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
      const token = localStorage.getItem('token');
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
        await axios.post('http://localhost:3000/api/laboratorios', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Laboratorio creado con éxito');
      } else {
        await axios.put(`http://localhost:3000/api/laboratorios/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Laboratorio modificado exitosamente');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || `Error al ${modalMode} laboratorio`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de dar de baja este laboratorio?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/laboratorios/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Laboratorio eliminado');
      onRefresh();
    } catch (error: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleOpenEquip = async (lab: LaboratorioAdminItem) => {
    setSelectedLabId(lab.id);
    setSelectedLabName(lab.nombre);
    setIsEquipModalOpen(true);
    setEquipForm({ equipamientoId: '', cantidad: '1' });
    await loadEquipData(lab.id);
  };

  const handleCrearEquipamientoBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEquipNombre.trim()) {
      return toast.error('Ingresa el nombre del equipamiento');
    }
    setGuardandoEquipBase(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:3000/api/equipamientos',
        {
          nombre: nuevoEquipNombre.trim(),
          tipo: 'General'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${nuevoEquipNombre.trim()}" registrado en el catálogo`);
      setNuevoEquipNombre('');
      setMostrarCrearEquip(false);
      // Recargar catálogo base
      const resBase = await axios.get('http://localhost:3000/api/equipamientos', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3000/api/equipamientos/laboratorio/${selectedLabId}/${equipId}`,
        { cantidad: cantNum },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cantidad actualizada');
      setEditingEquipId(null);
      await loadEquipData(selectedLabId);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar cantidad');
    }
  };

  const handleEliminarEquip = async (equipId: number, nombreEquip: string) => {
    if (!selectedLabId) return;
    if (!window.confirm(`¿Confirmas retirar "${nombreEquip}" de este laboratorio?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3000/api/equipamientos/laboratorio/${selectedLabId}/${equipId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${nombreEquip}" retirado del laboratorio`);
      await loadEquipData(selectedLabId);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al retirar equipamiento');
    }
  };

  const loadEquipData = async (labId: number) => {
    try {
      setIsEquipLoading(true);
      const token = localStorage.getItem('token');
      const resBase = await axios.get('http://localhost:3000/api/equipamientos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataBase = Array.isArray(resBase.data) ? resBase.data : (resBase.data?.data || []);
      setEquiposBase(dataBase);
      const resLab = await axios.get(`http://localhost:3000/api/laboratorios/${labId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentLabEquipos(resLab.data?.data?.equipos || resLab.data?.equipos || []);
    } catch (error) {
      toast.error('Error al cargar equipamiento');
    } finally {
      setIsEquipLoading(false);
    }
  };

  const handleAddEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId) return;
    try {
      await axios.post(
        `http://localhost:3000/api/equipamientos/laboratorio/${selectedLabId}`,
        {
          equipamientoId: Number(equipForm.equipamientoId),
          cantidad: Number(equipForm.cantidad)
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Equipamiento asignado al laboratorio');
      setEquipForm({ equipamientoId: '', cantidad: '1' });
      await loadEquipData(selectedLabId);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al vincular equipamiento');
    }
  };

  const handleOpenSchedule = (lab: LaboratorioAdminItem) => {
    setSelectedLabId(lab.id);
    setSelectedLabName(lab.nombre);
    setScheduleForm([...defaultSchedule]);
    setIsScheduleModalOpen(true);
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
      await axios.post(
        `http://localhost:3000/api/laboratorios/${selectedLabId}/horarios`,
        { horarios: payload },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
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
          className="bg-tech-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-sm transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo Laboratorio
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
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
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {lab.imagenUrl ? (
                          <img
                            src={lab.imagenUrl}
                            alt={lab.nombre}
                            className="w-10 h-10 object-cover rounded-xl shadow-xs border border-slate-200 dark:border-slate-700"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
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
                    <td className="px-6 py-4">{lab.capacidad} Asientos</td>
                    <td className="px-6 py-4">{lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={
                          lab.estadoOperativo === 'En Mantenimiento'
                            ? 'Mantenimiento'
                            : lab.estadoOperativo || 'Activo'
                        }
                        onChange={(e) => handleCambiarEstadoOperativo(lab.id, e.target.value as any)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-colors outline-none cursor-pointer ${
                          lab.estadoOperativo === 'En Mantenimiento' || lab.estadoOperativo === 'Mantenimiento'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                            : lab.estadoOperativo === 'Inactivo'
                            ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700'
                            : 'bg-green-50 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-700'
                        }`}
                        title="Cambiar estado operativo inmediatamente"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenSchedule(lab)}
                        title="Horarios"
                        className="p-2 text-slate-400 hover:text-indigo-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEquip(lab)}
                        title="Equipamiento"
                        className="p-2 text-slate-400 hover:text-amber-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                      >
                        <Box className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(lab)}
                        title="Editar"
                        className="p-2 text-slate-400 hover:text-tech-blue transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lab.id)}
                        title="Eliminar"
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
                {modalMode === 'crear' ? 'Nuevo Laboratorio' : `Editar: ${formData.nombre}`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="labForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Laboratorio
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Capacidad Total
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.capacidad}
                      onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Carrera Propietaria
                    </label>
                    <select
                      required
                      value={formData.carreraId}
                      onChange={(e) => setFormData({ ...formData, carreraId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                    >
                      <option value="" disabled>Seleccionar...</option>
                      {carreras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ubicación / Aula
                  </label>
                  <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                  />
                </div>

                {/* Geolocalización GPS y Campus FCyT (HU-31) */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-rose-500" />
                      Geolocalización GPS (Campus FCyT)
                    </label>
                    <button
                      type="button"
                      onClick={obtenerUbicacionGpsActual}
                      className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-tech-blue dark:text-blue-400 hover:bg-blue-100 rounded-lg font-semibold transition-colors flex items-center"
                    >
                      Detectar GPS actual
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Punto de referencia rápido (Edificios FCyT)
                    </label>
                    <select
                      onChange={(e) => {
                        const edificio = FCYT_BUILDINGS.find(b => b.nombre === e.target.value);
                        if (edificio) {
                          setFormData(prev => ({ ...prev, latitud: String(edificio.lat), longitud: String(edificio.lng) }));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">Seleccionar edificio del campus...</option>
                      {FCYT_BUILDINGS.map(b => (
                        <option key={b.nombre} value={b.nombre}>{b.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Latitud (WGS 84)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-17.393845"
                        value={formData.latitud}
                        onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Longitud (WGS 84)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-66.146210"
                        value={formData.longitud}
                        onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={formData.estadoOperativo}
                    onChange={(e) => setFormData({ ...formData, estadoOperativo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                {/* Carga de Fotografía del Laboratorio */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fotografía del Espacio Físico (Opcional)
                  </label>

                  {formData.imagenUrl ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 gap-4">
                      <div className="flex items-center space-x-3.5 w-full sm:w-auto overflow-hidden">
                        <img
                          src={formData.imagenUrl}
                          alt="Vista previa del laboratorio"
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500 shrink-0" />
                            Fotografía cargada y optimizada
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                            {formData.imagenUrl.startsWith('data:')
                              ? 'Archivo procesado localmente en alta fidelidad'
                              : formData.imagenUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xs transition"
                        >
                          Cambiar foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imagenUrl: '' })}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40 transition"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : modoCargaImagen === 'archivo' ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-tech-blue bg-blue-50/60 dark:bg-blue-950/30'
                          : 'border-slate-300 dark:border-slate-700 hover:border-tech-blue dark:hover:border-tech-blue bg-slate-50/60 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-2xl text-tech-blue">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        {isProcesandoImagen ? (
                          <p className="text-sm font-semibold text-tech-blue animate-pulse">
                            Procesando y optimizando imagen...
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              Arrastra tu fotografía aquí o{' '}
                              <span className="text-tech-blue underline">selecciona desde tu equipo</span>
                            </p>
                            <p className="text-xs text-slate-400">
                              Formatos admitidos: PNG, JPG, JPEG, WebP (Se escala y optimiza automáticamente)
                            </p>
                          </>
                        )}
                      </div>

                      <div className="mt-3.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModoCargaImagen('url');
                          }}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-tech-blue underline"
                        >
                          O ingresar mediante enlace web (URL)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={formData.imagenUrl}
                        onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                        placeholder="https://ejemplo.com/fotografia.jpg"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none text-sm"
                      />
                      <div className="flex justify-between items-center text-xs px-1">
                        <span className="text-slate-400">Pega un enlace web público hacia la imagen</span>
                        <button
                          type="button"
                          onClick={() => setModoCargaImagen('archivo')}
                          className="text-tech-blue hover:underline font-semibold"
                        >
                          Volver a subir desde el equipo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input de archivo nativo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Horario Operativo Semanal Inicial (Al crear nuevo laboratorio) */}
                {modalMode === 'crear' && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
                        <Clock className="w-4 h-4 mr-1.5 text-tech-blue" />
                        Horario Operativo Semanal
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleForm(scheduleForm.map(s => ({
                            ...s,
                            activo: s.dia !== 'Domingo',
                            horaApertura: '06:45',
                            horaCierre: s.dia === 'Sábado' ? '13:00' : '21:45'
                          })));
                          toast.success('Horario oficial FCyT cargado');
                        }}
                        className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-tech-blue dark:text-blue-400 hover:bg-blue-100 rounded-lg font-semibold transition-colors"
                      >
                        Aplicar Estándar FCyT (06:45 - 21:45)
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Define los días y franjas horarias de funcionamiento para que el laboratorio quede listo y disponible para reservas de inmediato.
                    </p>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {scheduleForm.map((diaInfo, idx) => (
                        <div
                          key={diaInfo.dia}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                            diaInfo.activo
                              ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer min-w-[90px]">
                            <input
                              type="checkbox"
                              checked={diaInfo.activo}
                              onChange={(e) => {
                                const nuevo = [...scheduleForm];
                                nuevo[idx].activo = e.target.checked;
                                setScheduleForm(nuevo);
                              }}
                              className="rounded text-tech-blue"
                            />
                            <span>{diaInfo.dia}</span>
                          </label>

                          {diaInfo.activo ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={diaInfo.horaApertura}
                                onChange={(e) => {
                                  const nuevo = [...scheduleForm];
                                  nuevo[idx].horaApertura = e.target.value;
                                  setScheduleForm(nuevo);
                                }}
                                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                              />
                              <span className="text-slate-400">a</span>
                              <input
                                type="time"
                                value={diaInfo.horaCierre}
                                onChange={(e) => {
                                  const nuevo = [...scheduleForm];
                                  nuevo[idx].horaCierre = e.target.value;
                                  setScheduleForm(nuevo);
                                }}
                                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Cerrado</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="reservaMode"
                    checked={formData.reservaPorComputadora}
                    onChange={(e) => setFormData({ ...formData, reservaPorComputadora: e.target.checked })}
                    className="w-5 h-5 text-tech-blue rounded border-gray-300 focus:ring-tech-blue"
                  />
                  <label htmlFor="reservaMode" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    ¿Las reservas son individuales por computadora? <br />
                    <span className="text-xs text-slate-500 font-normal">Si se desmarca, se reserva la sala completa.</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="labForm"
                className="px-6 py-2.5 rounded-xl font-bold bg-umss-blue hover:bg-blue-800 text-white shadow-md transition-colors"
              >
                {modalMode === 'crear' ? 'Guardar Laboratorio' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Equipamiento */}
      {isEquipModalOpen && (
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
                onClick={() => setIsEquipModalOpen(false)}
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
      )}

      {/* Modal Horarios */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Horarios de Apertura
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Laboratorio: {selectedLabName}</p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Activa los días que el laboratorio estará abierto y define su franja horaria.
              </p>
              {scheduleForm.map((diaInfo, index) => (
                <div
                  key={diaInfo.dia}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${
                    diaInfo.activo
                      ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                    <input
                      type="checkbox"
                      checked={diaInfo.activo}
                      onChange={() => handleToggleDay(index)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`font-bold ${diaInfo.activo ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {diaInfo.dia}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      disabled={!diaInfo.activo}
                      value={diaInfo.horaApertura}
                      onChange={(e) => handleChangeTime(index, 'horaApertura', e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      disabled={!diaInfo.activo}
                      value={diaInfo.horaCierre}
                      onChange={(e) => handleChangeTime(index, 'horaCierre', e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
              >
                Guardar Horarios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
