import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  X,
  Box,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  AlertCircle,
  Wrench,
  History,
  AlertTriangle,
  Search,
  Phone,
  Ban,
  FileText,
  Download,
  TrendingUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usuariosApi } from '../api/usuarios.api';
import { laboratoriosApi } from '../api/laboratorios.api';
import { reservasApi } from '../api/reservas.api';
import { sancionesApi } from '../api/sanciones.api';
import { reportesApi } from '../api/reportes.api';
import type { Usuario, Mantenimiento, AuditoriaEvento, Rol, Sancion, ResumenMetricasAcademicas } from '../types';



interface Carrera { id: number; nombre: string; }
interface Laboratorio {
  id: number; nombre: string; capacidad: number; ubicacion: string | null;
  estadoOperativo: string; reservaPorComputadora: boolean; carreraId: number | null;
  carrera?: Carrera | null;
  imagenUrl?: string | null;
}
interface EquipamientoBase { id: number; nombre: string; tipo: string; }
interface LabEquipo { cantidad: number; equipamiento: EquipamientoBase; }
interface Solicitud {
  id: number; rolSolicitado: string; motivo: string; estado: string; createdAt: string;
  usuario: { nombreCompleto: string; correo: string; rol: { nombre: string } };
}
interface ReservaPendiente {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  materia: string;
  cantidadAlumnos: number;
  motivo: string | null;
  estado: string;
  usuario: { nombreCompleto: string; correo: string };
  laboratorio: { id: number; nombre: string; capacidad: number; ubicacion: string | null };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'laboratorios' | 'usuarios' | 'reservas' | 'mantenimientos' | 'feriados' | 'auditoria' | 'sanciones' | 'reportes'>('laboratorios');
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [reservasPendientes, setReservasPendientes] = useState<ReservaPendiente[]>([]);
  const [feriadosList, setFeriadosList] = useState<{ id: number; fecha: string; motivo: string; bloqueoActivo: boolean }[]>([]);
  const [isFeriadoModalOpen, setIsFeriadoModalOpen] = useState(false);
  const [feriadoForm, setFeriadoForm] = useState({ fecha: '', motivo: '' });
  const [isSubmittingFeriado, setIsSubmittingFeriado] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // HU-02: Gestión Integral de Usuarios y Roles
  const [usuariosList, setUsuariosList] = useState<Usuario[]>([]);
  const [rolesList, setRolesList] = useState<Rol[]>([]);
  const [subTabUsuarios, setSubTabUsuarios] = useState<'directorio' | 'solicitudes'>('directorio');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  // HU-11: Mantenimientos
  const [mantenimientosList, setMantenimientosList] = useState<Mantenimiento[]>([]);
  const [isMantenimientoModalOpen, setIsMantenimientoModalOpen] = useState(false);
  const [mantenimientoForm, setMantenimientoForm] = useState({
    laboratorioId: '',
    fechaInicio: '',
    fechaFin: '',
    motivo: ''
  });
  const [isSubmittingMantenimiento, setIsSubmittingMantenimiento] = useState(false);

  // HU-19: Cancelación por Fuerza Mayor
  const [isFuerzaMayorModalOpen, setIsFuerzaMayorModalOpen] = useState(false);
  const [reservaAFuerzaMayor, setReservaAFuerzaMayor] = useState<ReservaPendiente | null>(null);
  const [motivoFuerzaMayor, setMotivoFuerzaMayor] = useState('');
  const [isSubmittingFuerzaMayor, setIsSubmittingFuerzaMayor] = useState(false);

  // HU-05: Auditoría de Sesiones y Accesos
  const [auditoriaList, setAuditoriaList] = useState<AuditoriaEvento[]>([]);

  // HU-33: Gestión y Levantamiento de Sanciones Disciplinarias
  const [sancionesList, setSancionesList] = useState<Sancion[]>([]);
  const [filtroEstadoSancion, setFiltroEstadoSancion] = useState<'Todas' | 'Activa' | 'Expirada' | 'Perdonada'>('Todas');
  const [isManualSancionModalOpen, setIsManualSancionModalOpen] = useState(false);
  const [manualSancionForm, setManualSancionForm] = useState({ usuarioId: '', horasDuracion: '24', motivo: '' });
  const [isSubmittingManualSancion, setIsSubmittingManualSancion] = useState(false);
  const [isPerdonarModalOpen, setIsPerdonarModalOpen] = useState(false);
  const [sancionAPerdonar, setSancionAPerdonar] = useState<Sancion | null>(null);
  const [motivoPerdon, setMotivoPerdon] = useState('');
  const [isSubmittingPerdon, setIsSubmittingPerdon] = useState(false);
  const [isProcesandoInasistencias, setIsProcesandoInasistencias] = useState(false);

  // HU-35: Informes y Métricas Académicas de Ocupación
  const [metricasData, setMetricasData] = useState<ResumenMetricasAcademicas | null>(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroLabId, setFiltroLabId] = useState('');
  const [isLoadingMetricas, setIsLoadingMetricas] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);


  const [isRechazarModalOpen, setIsRechazarModalOpen] = useState(false);
  const [reservaARechazar, setReservaARechazar] = useState<ReservaPendiente | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isSubmittingRechazo, setIsSubmittingRechazo] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [editingId, setEditingId] = useState<number | null>(null);

  // AÑADIDO: estadoOperativo e imagenUrl
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: '',
    ubicacion: '',
    carreraId: '',
    reservaPorComputadora: false,
    estadoOperativo: 'Activo',
    imagenUrl: ''
  });

  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [selectedLabName, setSelectedLabName] = useState('');
  const [equiposBase, setEquiposBase] = useState<EquipamientoBase[]>([]);
  const [currentLabEquipos, setCurrentLabEquipos] = useState<LabEquipo[]>([]);
  const [equipForm, setEquipForm] = useState({ equipamientoId: '', cantidad: '1' });
  const [isEquipLoading, setIsEquipLoading] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const defaultSchedule = [
    { dia: 'Lunes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Martes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Miércoles', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Jueves', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Viernes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Sábado', activo: false, horaApertura: '08:00', horaCierre: '12:00' },
    { dia: 'Domingo', activo: false, horaApertura: '08:00', horaCierre: '12:00' },
  ];
  const [scheduleForm, setScheduleForm] = useState(defaultSchedule);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resLabs, resCarreras, resSols, resReservas, resFeriados, users, mants, audits, rolesRes, sanctions] = await Promise.all([
        axios.get('http://localhost:3000/api/laboratorios?incluirTodos=true'),
        axios.get('http://localhost:3000/api/carreras'),
        axios.get('http://localhost:3000/api/roles/requests', { headers }),
        axios.get('http://localhost:3000/api/reservas/pendientes', { headers }),
        axios.get('http://localhost:3000/api/feriados'),
        usuariosApi.listar().catch(() => []),
        laboratoriosApi.listarMantenimientos().catch(() => []),
        usuariosApi.obtenerAuditoriaSesiones(100).catch(() => []),
        axios.get('http://localhost:3000/api/roles').catch(() => ({ data: [] })),
        sancionesApi.listarTodas().catch(() => [])
      ]);

      setLaboratorios(resLabs.data.laboratorios || []);
      setCarreras(resCarreras.data || []);
      setSolicitudes(resSols.data || []);
      setReservasPendientes(resReservas.data.data || []);
      setFeriadosList(resFeriados.data.data || []);
      setUsuariosList(users || []);
      setMantenimientosList(mants || []);
      setAuditoriaList(audits || []);
      setRolesList(rolesRes.data || []);
      setSancionesList(sanctions || []);
    } catch (error) {
      toast.error('Error al cargar datos del sistema');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // HU-10: Cambiar estado operativo rápido
  const handleCambiarEstadoOperativo = async (labId: number, nuevoEstado: 'Activo' | 'Mantenimiento' | 'Inactivo') => {
    try {
      await laboratoriosApi.cambiarEstadoOperativo(labId, nuevoEstado);
      toast.success(`Estado operativo actualizado a "${nuevoEstado}"`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  // HU-02: Cambiar rol directamente a un usuario
  const handleCambiarRolUsuario = async (usuarioId: number, nuevoRolId: number, nombre: string) => {
    const rolObj = rolesList.find(r => r.id === nuevoRolId);
    if (!window.confirm(`¿Confirmas la asignación del rol "${rolObj?.nombre || 'Nuevo Rol'}" para ${nombre}?`)) return;
    try {
      await usuariosApi.cambiarRol(usuarioId, nuevoRolId);
      toast.success(`Rol asignado correctamente a ${nombre}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar rol');
    }
  };

  // HU-02: Activar o suspender cuenta de usuario
  const handleCambiarEstadoUsuario = async (usuarioId: number, activoActual: boolean, nombre: string) => {
    const nuevoEstado = !activoActual;
    const accion = nuevoEstado ? 'habilitar' : 'suspender';
    if (!window.confirm(`¿Confirmas ${accion} el acceso de ${nombre}?`)) return;
    try {
      await usuariosApi.cambiarEstado(usuarioId, nuevoEstado);
      toast.success(`Cuenta de ${nombre} ${nuevoEstado ? 'habilitada' : 'suspendida'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al modificar estado');
    }
  };

  // HU-11: Registrar reporte de mantenimiento y bloqueo
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
      toast.success('Mantenimiento programado y agenda bloqueada correctamente');
      setIsMantenimientoModalOpen(false);
      setMantenimientoForm({ laboratorioId: '', fechaInicio: '', fechaFin: '', motivo: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar mantenimiento');
    } finally {
      setIsSubmittingMantenimiento(false);
    }
  };

  // HU-11: Eliminar mantenimiento
  const handleEliminarMantenimiento = async (id: number, labNombre: string) => {
    if (!window.confirm(`¿Anular el mantenimiento programado para ${labNombre}? Se reabrirá la agenda para reservas.`)) return;
    try {
      await laboratoriosApi.eliminarMantenimiento(id);
      toast.success('Mantenimiento cancelado y agenda reabierta');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cancelar mantenimiento');
    }
  };

  // HU-19: Abrir modal de cancelación por fuerza mayor
  const handleAbrirFuerzaMayor = (reserva: ReservaPendiente) => {
    setReservaAFuerzaMayor(reserva);
    setMotivoFuerzaMayor('');
    setIsFuerzaMayorModalOpen(true);
  };

  // HU-19: Confirmar cancelación por fuerza mayor
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
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al procesar cancelación');
    } finally {
      setIsSubmittingFuerzaMayor(false);
    }
  };

  // HU-33: Abrir modal de levantamiento / perdón de sanción
  const handleAbrirPerdonar = (sancion: Sancion) => {
    setSancionAPerdonar(sancion);
    setMotivoPerdon('');
    setIsPerdonarModalOpen(true);
  };

  // HU-33: Confirmar levantamiento de sanción
  const handleConfirmarPerdonar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sancionAPerdonar) return;
    setIsSubmittingPerdon(true);
    try {
      await sancionesApi.perdonarSancion(sancionAPerdonar.id, motivoPerdon.trim() || undefined);
      toast.success(`Sanción levantada para ${sancionAPerdonar.usuario.nombreCompleto}`);
      setIsPerdonarModalOpen(false);
      setSancionAPerdonar(null);
      setMotivoPerdon('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al levantar sanción');
    } finally {
      setIsSubmittingPerdon(false);
    }
  };

  // HU-33: Crear sanción manual
  const handleCrearSancionManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSancionForm.usuarioId || !manualSancionForm.motivo.trim()) {
      return toast.error('Selecciona un usuario e ingresa el motivo');
    }
    const horas = Number(manualSancionForm.horasDuracion);
    if (isNaN(horas) || horas < 1 || horas > 720) {
      return toast.error('Las horas de duración deben estar entre 1 y 720');
    }

    setIsSubmittingManualSancion(true);
    try {
      await sancionesApi.crearSancionManual({
        usuarioId: Number(manualSancionForm.usuarioId),
        horasDuracion: horas,
        motivo: manualSancionForm.motivo.trim()
      });
      toast.success('Sanción disciplinaria aplicada exitosamente');
      setIsManualSancionModalOpen(false);
      setManualSancionForm({ usuarioId: '', horasDuracion: '24', motivo: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al aplicar sanción manual');
    } finally {
      setIsSubmittingManualSancion(false);
    }
  };

  // HU-30: Ejecutar barrido manual de inasistencias
  const handleEjecutarInasistencias = async () => {
    if (!window.confirm('¿Ejecutar proceso de detección de inasistencias? Se evaluarán todas las reservas aprobadas cuyo tiempo de tolerancia haya expirado.')) return;
    setIsProcesandoInasistencias(true);
    try {
      const res = await sancionesApi.procesarInasistencias(15);
      toast.success(res.mensaje || 'Proceso completado exitosamente');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al procesar inasistencias');
    } finally {
      setIsProcesandoInasistencias(false);
    }
  };

  // HU-35: Cargar métricas académicas de ocupación
  const handleCargarMetricas = async () => {
    setIsLoadingMetricas(true);
    try {
      const data = await reportesApi.obtenerMetricas(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      setMetricasData(data);
    } catch (error) {
      toast.error('Error al obtener métricas de ocupación');
    } finally {
      setIsLoadingMetricas(false);
    }
  };

  // HU-35: Descargar archivo CSV de métricas
  const handleDescargarCsvMetricas = async () => {
    setIsDownloadingCsv(true);
    try {
      await reportesApi.descargarCsv(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      toast.success('Informe CSV de ocupación descargado exitosamente');
    } catch (error) {
      toast.error('Error al exportar métricas en CSV');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reportes' && !metricasData) {
      handleCargarMetricas();
    }
  }, [activeTab]);



  const usuariosFiltrados = usuariosList.filter(u => {
    if (!busquedaUsuario.trim()) return true;
    const q = busquedaUsuario.toLowerCase();
    return (
      u.nombreCompleto?.toLowerCase().includes(q) ||
      u.correo?.toLowerCase().includes(q) ||
      u.telefono?.toLowerCase().includes(q) ||
      u.rol?.nombre?.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setModalMode('crear');
    setEditingId(null);
    setFormData({ nombre: '', capacidad: '', ubicacion: '', carreraId: '', reservaPorComputadora: false, estadoOperativo: 'Activo', imagenUrl: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lab: Laboratorio) => {
    setModalMode('editar');
    setEditingId(lab.id);
    setFormData({
      nombre: lab.nombre,
      capacidad: lab.capacidad.toString(),
      ubicacion: lab.ubicacion || '',
      carreraId: lab.carreraId ? lab.carreraId.toString() : '',
      reservaPorComputadora: lab.reservaPorComputadora,
      estadoOperativo: lab.estadoOperativo || 'Activo',
      imagenUrl: lab.imagenUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      return toast.error('El nombre del laboratorio es obligatorio');
    }
    const capNum = Number(formData.capacidad);
    if (isNaN(capNum) || capNum <= 0) {
      return toast.error('La capacidad debe ser un número positivo mayor a cero');
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        nombre: formData.nombre.trim(),
        capacidad: capNum,
        ubicacion: formData.ubicacion.trim(),
        carreraId: formData.carreraId ? Number(formData.carreraId) : null,
        reservaPorComputadora: formData.reservaPorComputadora,
        estadoOperativo: formData.estadoOperativo,
        imagenUrl: formData.imagenUrl.trim() ? formData.imagenUrl.trim() : null
      };

      if (modalMode === 'crear') {
        await axios.post('http://localhost:3000/api/laboratorios', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Laboratorio creado con éxito');
      } else {
        await axios.put(`http://localhost:3000/api/laboratorios/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Laboratorio modificado exitosamente');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || `Error al ${modalMode} laboratorio`;
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de dar de baja este laboratorio?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/laboratorios/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success('Laboratorio eliminado');
      fetchData();
    } catch (error: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleOpenEquip = async (lab: Laboratorio) => { setSelectedLabId(lab.id); setSelectedLabName(lab.nombre); setIsEquipModalOpen(true); setEquipForm({ equipamientoId: '', cantidad: '1' }); await loadEquipData(lab.id); };
  const loadEquipData = async (labId: number) => {
    try {
      setIsEquipLoading(true);
      const token = localStorage.getItem('token');
      const resBase = await axios.get('http://localhost:3000/api/equipamientos', { headers: { Authorization: `Bearer ${token}` } }); setEquiposBase(resBase.data);
      const resLab = await axios.get(`http://localhost:3000/api/laboratorios/${labId}`, { headers: { Authorization: `Bearer ${token}` } }); setCurrentLabEquipos(resLab.data.data.equipos || []);
    } catch (error) { toast.error('Error al cargar equipamiento'); } finally { setIsEquipLoading(false); }
  };
  const handleAddEquip = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedLabId) return;
    try {
      await axios.post(`http://localhost:3000/api/equipamientos/laboratorio/${selectedLabId}`, { equipamientoId: Number(equipForm.equipamientoId), cantidad: Number(equipForm.cantidad) }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success('Equipamiento vinculado');
      setEquipForm({ equipamientoId: '', cantidad: '1' });
      await loadEquipData(selectedLabId);
    } catch (error: any) { toast.error(error.response?.data?.error || 'Error al vincular equipamiento'); }
  };

  const handleOpenSchedule = (lab: Laboratorio) => { setSelectedLabId(lab.id); setSelectedLabName(lab.nombre); setScheduleForm([...defaultSchedule]); setIsScheduleModalOpen(true); };
  const handleToggleDay = (index: number) => { const newSchedule = [...scheduleForm]; newSchedule[index].activo = !newSchedule[index].activo; setScheduleForm(newSchedule); };
  const handleChangeTime = (index: number, field: 'horaApertura' | 'horaCierre', value: string) => { const newSchedule = [...scheduleForm]; newSchedule[index][field] = value; setScheduleForm(newSchedule); };
  const handleSaveSchedule = async () => {
    if (!selectedLabId) return;
    const payload = scheduleForm.filter(d => d.activo).map(d => ({ dia: d.dia, horaApertura: d.horaApertura, horaCierre: d.horaCierre }));
    if (payload.length === 0) return toast.error('Debes habilitar al menos un día');
    try {
      await axios.post(`http://localhost:3000/api/laboratorios/${selectedLabId}/horarios`, { horarios: payload }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success('Horarios configurados exitosamente');
      setIsScheduleModalOpen(false);
    } catch (error: any) { toast.error(error.response?.data?.error || 'Error al guardar horarios'); }
  };

  const handleGestionarSolicitud = async (id: number, accion: 'Aprobar' | 'Rechazar') => {
    if (!window.confirm(`¿Estás seguro de ${accion.toLowerCase()} esta solicitud?`)) return;
    try {
      await axios.put(`http://localhost:3000/api/roles/manage/${id}`, { accion }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success(`Solicitud ${accion.toLowerCase()}da correctamente`);
      fetchData();
    } catch (error: any) {
      toast.error('Error al gestionar solicitud');
    }
  };

  const handleAprobarReserva = async (id: number) => {
    if (!window.confirm('¿Confirmar aprobación de esta reserva de laboratorio? Se emitirá el código QR de acceso.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/reservas/${id}/gestionar`, { accion: 'Aprobar' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reserva aprobada exitosamente y token QR emitido');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al aprobar reserva');
    }
  };

  const handleAbrirRechazo = (reserva: ReservaPendiente) => {
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
      await axios.put(`http://localhost:3000/api/reservas/${reservaARechazar.id}/gestionar`, {
        accion: 'Rechazar',
        motivoRechazo: motivoRechazo.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reserva rechazada y horario liberado para nuevas solicitudes');
      setIsRechazarModalOpen(false);
      setReservaARechazar(null);
      setMotivoRechazo('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al rechazar reserva');
    } finally {
      setIsSubmittingRechazo(false);
    }
  };

  const handleCrearFeriado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feriadoForm.fecha || !feriadoForm.motivo.trim()) {
      return toast.error('La fecha y el motivo son obligatorios');
    }

    setIsSubmittingFeriado(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/feriados', feriadoForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Feriado o día bloqueado registrado correctamente');
      setIsFeriadoModalOpen(false);
      setFeriadoForm({ fecha: '', motivo: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar feriado');
    } finally {
      setIsSubmittingFeriado(false);
    }
  };

  const handleEliminarFeriado = async (id: number, motivo: string) => {
    if (!window.confirm(`¿Estás seguro de anular la restricción para "${motivo}"? El día quedará reabierto para reservas.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/feriados/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Feriado eliminado. El día ha sido reabierto para reservas.');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar feriado');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-tech-blue" /> Panel de Administración
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona laboratorios, inventario y solicitudes de usuarios.</p>
          </div>
          <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setActiveTab('laboratorios')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'laboratorios' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Server className="w-4 h-4 mr-1.5" />
              Laboratorios
            </button>
            <button onClick={() => setActiveTab('usuarios')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'usuarios' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Users className="w-4 h-4 mr-1.5" />
              Usuarios & Roles
              {solicitudes.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'usuarios' ? 'bg-white text-tech-blue' : 'bg-rose-500 text-white'}`}>{solicitudes.length}</span>}
            </button>
            <button onClick={() => setActiveTab('reservas')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'reservas' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Calendar className="w-4 h-4 mr-1.5" />
              Bandeja Reservas
              {reservasPendientes.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'reservas' ? 'bg-white text-tech-blue' : 'bg-amber-500 text-white'}`}>{reservasPendientes.length}</span>}
            </button>
            <button onClick={() => setActiveTab('mantenimientos')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'mantenimientos' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Wrench className="w-4 h-4 mr-1.5" />
              Mantenimientos
              {mantenimientosList.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'mantenimientos' ? 'bg-white text-tech-blue' : 'bg-indigo-600 text-white'}`}>{mantenimientosList.length}</span>}
            </button>
            <button onClick={() => setActiveTab('feriados')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'feriados' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Clock className="w-4 h-4 mr-1.5" />
              Feriados y Bloqueos
              {feriadosList.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'feriados' ? 'bg-white text-tech-blue' : 'bg-indigo-600 text-white'}`}>{feriadosList.length}</span>}
            </button>
            <button onClick={() => setActiveTab('auditoria')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'auditoria' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <History className="w-4 h-4 mr-1.5" />
              Auditoría
            </button>
            <button onClick={() => setActiveTab('sanciones')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'sanciones' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Ban className="w-4 h-4 mr-1.5" />
              Sanciones (HU-33)
              {sancionesList.filter(s => s.estado === 'Activa').length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'sanciones' ? 'bg-white text-tech-blue' : 'bg-rose-500 text-white'}`}>
                  {sancionesList.filter(s => s.estado === 'Activa').length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('reportes')} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'reportes' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Métricas & Ocupación (HU-35)
            </button>
          </div>
        </div>

        {activeTab === 'laboratorios' && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4"><button onClick={handleOpenCreate} className="bg-tech-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-sm transition-all"><Plus className="w-5 h-5 mr-2" /> Nuevo Laboratorio</button></div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
                    <tr><th className="px-6 py-4 font-bold">Laboratorio</th><th className="px-6 py-4 font-bold">Capacidad</th><th className="px-6 py-4 font-bold">Modalidad</th><th className="px-6 py-4 font-bold">Estado</th><th className="px-6 py-4 font-bold text-right">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {isLoading ? (<tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>)
                      : laboratorios.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay laboratorios registrados</td></tr>)
                        : (laboratorios.map(lab => (
                          <tr key={lab.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {lab.imagenUrl ? (
                                  <img src={lab.imagenUrl} alt={lab.nombre} className="w-10 h-10 object-cover rounded-xl shadow-xs border border-slate-200 dark:border-slate-700" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                    <Server className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{lab.nombre}</p>
                                  <p className="text-xs text-slate-500">{lab.ubicacion || 'Sin ubicación'} • {lab.carrera?.nombre || 'General'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">{lab.capacidad} Asientos</td>
                            <td className="px-6 py-4">{lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}</td>
                            <td className="px-6 py-4">
                              <select
                                value={lab.estadoOperativo === 'En Mantenimiento' ? 'Mantenimiento' : lab.estadoOperativo || 'Activo'}
                                onChange={(e) => handleCambiarEstadoOperativo(lab.id, e.target.value as any)}
                                className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-colors outline-none cursor-pointer ${
                                  lab.estadoOperativo === 'En Mantenimiento' || lab.estadoOperativo === 'Mantenimiento'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                                    : lab.estadoOperativo === 'Inactivo'
                                    ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700'
                                    : 'bg-green-50 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-700'
                                }`}
                                title="Cambiar estado operativo inmediatamente (HU-10)"
                              >
                                <option value="Activo">Activo</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Inactivo">Inactivo</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => handleOpenSchedule(lab)} title="Horarios" className="p-2 text-slate-400 hover:text-indigo-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Clock className="w-4 h-4" /></button>
                              <button onClick={() => handleOpenEquip(lab)} title="Equipamiento" className="p-2 text-slate-400 hover:text-amber-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Box className="w-4 h-4" /></button>
                              <button onClick={() => handleOpenEdit(lab)} title="Editar" className="p-2 text-slate-400 hover:text-tech-blue transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(lab.id)} title="Eliminar" className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSubTabUsuarios('directorio')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    subTabUsuarios === 'directorio'
                      ? 'bg-tech-blue text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Directorio de Usuarios ({usuariosList.length})
                </button>
                <button
                  onClick={() => setSubTabUsuarios('solicitudes')}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    subTabUsuarios === 'solicitudes'
                      ? 'bg-tech-blue text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Solicitudes Pendientes
                  {solicitudes.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white">
                      {solicitudes.length}
                    </span>
                  )}
                </button>
              </div>

              {subTabUsuarios === 'directorio' && (
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo o rol..."
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                  />
                </div>
              )}
            </div>

            {subTabUsuarios === 'directorio' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
                      <tr>
                        <th className="px-6 py-4 font-bold">Usuario</th>
                        <th className="px-6 py-4 font-bold">Contacto</th>
                        <th className="px-6 py-4 font-bold">Rol Asignado</th>
                        <th className="px-6 py-4 font-bold">Estado de Cuenta</th>
                        <th className="px-6 py-4 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>
                      ) : usuariosFiltrados.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No se encontraron usuarios coincidentes</td></tr>
                      ) : (
                        usuariosFiltrados.map((u) => (
                          <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 dark:text-white">{u.nombreCompleto}</p>
                              <p className="text-xs text-slate-500">{u.correo}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                                <Phone className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                                {u.telefono || 'Sin teléfono'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={u.rolId}
                                onChange={(e) => handleCambiarRolUsuario(u.id, Number(e.target.value), u.nombreCompleto)}
                                className="text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-tech-blue"
                                title="Cambiar rol institucional directamente"
                              >
                                {rolesList.map((r) => (
                                  <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                u.activo !== false
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              }`}>
                                {u.activo !== false ? 'Activo' : 'Suspendido'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleCambiarEstadoUsuario(u.id, u.activo !== false, u.nombreCompleto)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors shadow-sm ${
                                  u.activo !== false
                                    ? 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30'
                                    : 'text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30'
                                }`}
                              >
                                {u.activo !== false ? 'Suspender' : 'Habilitar'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subTabUsuarios === 'solicitudes' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
                      <tr><th className="px-6 py-4 font-bold">Usuario</th><th className="px-6 py-4 font-bold">Rol Actual</th><th className="px-6 py-4 font-bold">Solicita</th><th className="px-6 py-4 font-bold">Motivo</th><th className="px-6 py-4 font-bold text-right">Decisión</th></tr>
                    </thead>
                    <tbody>
                      {isLoading ? (<tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>)
                        : solicitudes.length === 0 ? (<tr><td colSpan={5} className="px-6 py-16 text-center"><Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-500 font-medium">No hay solicitudes pendientes.</p></td></tr>)
                          : (solicitudes.map(sol => (
                            <tr key={sol.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                              <td className="px-6 py-4"><p className="font-bold text-slate-900 dark:text-white">{sol.usuario.nombreCompleto}</p><p className="text-xs text-slate-500">{sol.usuario.correo}</p></td>
                              <td className="px-6 py-4"><span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">{(sol.usuario.rol as any)?.nombre || 'Estudiante'}</span></td>
                              <td className="px-6 py-4 font-bold text-tech-blue dark:text-blue-400">{sol.rolSolicitado}</td>
                              <td className="px-6 py-4 max-w-xs truncate" title={sol.motivo}>{sol.motivo}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => handleGestionarSolicitud(sol.id, 'Aprobar')} title="Aprobar" className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"><CheckCircle className="w-5 h-5" /></button>
                                <button onClick={() => handleGestionarSolicitud(sol.id, 'Rechazar')} title="Rechazar" className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"><XCircle className="w-5 h-5" /></button>
                              </td>
                            </tr>
                          )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Bandeja de Reservas (HU-16 y HU-17) */}
        {activeTab === 'reservas' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-bold">Laboratorio</th>
                    <th className="px-6 py-4 font-bold">Docente Solicitante</th>
                    <th className="px-6 py-4 font-bold">Materia / Alumnos</th>
                    <th className="px-6 py-4 font-bold">Fecha y Horario</th>
                    <th className="px-6 py-4 font-bold">Motivo</th>
                    <th className="px-6 py-4 font-bold text-right">Decisión</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>
                  ) : reservasPendientes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No hay reservas pendientes de aprobación.</p>
                        <p className="text-xs text-slate-400 mt-1">Todas las solicitudes han sido gestionadas.</p>
                      </td>
                    </tr>
                  ) : (
                    reservasPendientes.map(res => {
                      const start = new Date(res.fechaInicio);
                      const end = new Date(res.fechaFin);
                      return (
                        <tr key={res.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 dark:text-white">{res.laboratorio.nombre}</p>
                            <p className="text-xs text-slate-500">{res.laboratorio.ubicacion || 'Campus Central'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 dark:text-white">{res.usuario.nombreCompleto}</p>
                            <p className="text-xs text-slate-500">{res.usuario.correo}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-tech-blue dark:text-blue-400">{res.materia || 'Práctica General'}</p>
                            <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold mt-1">
                              {res.cantidadAlumnos} alumnos
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {start.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center mt-0.5">
                              <Clock className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                              {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate" title={res.motivo || 'Sin justificación'}>
                            {res.motivo || <span className="text-slate-400 italic">Sin justificación</span>}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleAprobarReserva(res.id)}
                              title="Aprobar Reserva"
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleAbrirRechazo(res)}
                              title="Rechazar Reserva"
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleAbrirFuerzaMayor(res)}
                              title="Cancelar por Fuerza Mayor (HU-19)"
                              className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                              <AlertTriangle className="w-5 h-5" />
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
        )}

        {activeTab === 'feriados' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white">
                  Calendario de Feriados y Días Bloqueados (HU-29)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Las fechas aquí registradas inhabilitan automáticamente cualquier solicitud de reserva en la facultad.
                </p>
              </div>
              <button
                onClick={() => { setFeriadoForm({ fecha: '', motivo: '' }); setIsFeriadoModalOpen(true); }}
                className="bg-tech-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-sm transition-all"
              >
                <Plus className="w-5 h-5 mr-2" /> Nuevo Feriado / Bloqueo
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-bold">Fecha Restringida</th>
                      <th className="px-6 py-4 font-bold">Motivo Institucional</th>
                      <th className="px-6 py-4 font-bold">Estado</th>
                      <th className="px-6 py-4 font-bold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>
                    ) : feriadosList.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay feriados o días bloqueados configurados</td></tr>
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
                                {f.bloqueoActivo ? '⛔ Bloqueo Activo' : '⚪ Inactivo'}
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
          </div>
        )}

        {/* Pestaña: Mantenimientos Programados y Bloqueos (HU-11) */}
        {activeTab === 'mantenimientos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-tech-blue" />
                  Programación de Mantenimiento y Bloqueos (HU-11)
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
                      <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>
                    ) : mantenimientosList.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay mantenimientos activos ni programados</td></tr>
                    ) : (
                      mantenimientosList.map((m) => {
                        const inicio = new Date(m.fechaInicio);
                        const fin = new Date(m.fechaFin);
                        const ahora = new Date();
                        const enCurso = ahora >= inicio && ahora <= fin;

                        return (
                          <tr key={m.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 dark:text-white">{m.laboratorio?.nombre || `Laboratorio #${m.laboratorioId}`}</p>
                              <p className="text-xs text-slate-500">{m.laboratorio?.ubicacion || 'Campus Central'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {inicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-slate-500">
                                hasta {fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
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
          </div>
        )}

        {/* Pestaña: Auditoría de Sesiones y Accesos (HU-05) */}
        {activeTab === 'auditoria' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <History className="w-5 h-5 mr-2 text-tech-blue" />
                Historial de Accesos y Trazabilidad de Sesiones (HU-05)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro inmutable de ingresos, inicios de sesión y eventos críticos de seguridad para fines de auditoría.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
                    <tr>
                      <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                      <th className="px-6 py-4 font-bold">Usuario</th>
                      <th className="px-6 py-4 font-bold">Evento / Acción</th>
                      <th className="px-6 py-4 font-bold">Dirección IP</th>
                      <th className="px-6 py-4 font-bold">Dispositivo / Agente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>
                    ) : auditoriaList.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay registros de auditoría disponibles</td></tr>
                    ) : (
                      auditoriaList.map((ev) => {
                        const fechaEv = new Date(ev.fechaHora);
                        return (
                          <tr key={ev.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                              {fechaEv.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                              {fechaEv.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 dark:text-white">{ev.usuario?.nombreCompleto || 'Usuario del Sistema'}</p>
                              <p className="text-xs text-slate-500">{ev.usuario?.correo || `ID: ${ev.usuarioId}`}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{ev.accion}</span>
                              {ev.detalles && <p className="text-xs text-slate-400 mt-0.5">{ev.detalles}</p>}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {ev.ip || '127.0.0.1'}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={ev.userAgent || 'Desconocido'}>
                              {ev.userAgent || 'Cliente Web'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Gestión y Levantamiento de Sanciones Disciplinarias (HU-33) */}
        {activeTab === 'sanciones' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div>
                <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                  <Ban className="w-5 h-5 mr-2 text-rose-600" />
                  Régimen Disciplinario y Sanciones (HU-30 y HU-33)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control institucional de bloqueos por inasistencia y aplicación/levantamiento de sanciones a docentes y estudiantes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleEjecutarInasistencias}
                  disabled={isProcesandoInasistencias}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition flex items-center shadow-xs disabled:opacity-50"
                  title="Detectar reservas sin check-in tras el tiempo de tolerancia y suspender por 24 horas"
                >
                  <Clock className="w-4 h-4 mr-1.5 text-amber-500" />
                  {isProcesandoInasistencias ? 'Procesando...' : 'Barrer Inasistencias (HU-30)'}
                </button>
                <button
                  onClick={() => {
                    setManualSancionForm({ usuarioId: '', horasDuracion: '24', motivo: '' });
                    setIsManualSancionModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Aplicar Sanción Manual
                </button>
              </div>
            </div>

            {/* Filtros rápidos de estado */}
            <div className="flex items-center space-x-2">
              {(['Todas', 'Activa', 'Perdonada', 'Expirada'] as const).map((est) => {
                const cant = est === 'Todas' ? sancionesList.length : sancionesList.filter(s => s.estado === est).length;
                return (
                  <button
                    key={est}
                    onClick={() => setFiltroEstadoSancion(est)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filtroEstadoSancion === est
                        ? 'bg-tech-blue text-white shadow'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {est} ({cant})
                  </button>
                );
              })}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
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
                      <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>
                    ) : (
                      sancionesList
                        .filter(s => filtroEstadoSancion === 'Todas' || s.estado === filtroEstadoSancion)
                        .map((s) => {
                          const inicio = new Date(s.fechaInicio);
                          const fin = new Date(s.fechaFin);
                          const ahora = new Date();
                          const activaReal = s.estado === 'Activa' && ahora < fin;

                          return (
                            <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
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
                                  Desde: {inicio.toLocaleDateString('es-ES')} {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-slate-500">
                                  Hasta: {fin.toLocaleDateString('es-ES')} {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  s.estado === 'Activa' && activaReal
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                    : s.estado === 'Perdonada'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
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
                    {!isLoading && sancionesList.filter(s => filtroEstadoSancion === 'Todas' || s.estado === filtroEstadoSancion).length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No se encontraron sanciones registradas en este estado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Informes y Métricas Académicas de Ocupación (HU-35) */}
        {activeTab === 'reportes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div>
                <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-tech-blue" />
                  Métricas de Ocupación e Informes Académicos (HU-35)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consolidado institucional de horas lectivas, tasas de aprovechamiento y exportación de datos para acreditación universitaria.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/reportes/asistencias"
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition flex items-center shadow-xs"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-tech-blue" />
                  Auditoría Diaria (HU-24 / Power BI)
                </Link>
                <button
                  onClick={handleDescargarCsvMetricas}
                  disabled={isDownloadingCsv || isLoadingMetricas}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center shadow-sm disabled:opacity-50"
                  title="Descargar archivo CSV compatible con Excel con todas las métricas de ocupación"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  {isDownloadingCsv ? 'Generando CSV...' : 'Exportar CSV (Excel)'}
                </button>
              </div>
            </div>

            {/* Barra de Filtros por Rango de Fechas y Laboratorio */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Filtrar por Laboratorio</label>
                <select
                  value={filtroLabId}
                  onChange={(e) => setFiltroLabId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white"
                >
                  <option value="">Todos los laboratorios</option>
                  {laboratorios.map((l) => (
                    <option key={l.id} value={l.id}>{l.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <button
                  onClick={handleCargarMetricas}
                  disabled={isLoadingMetricas}
                  className="w-full py-2 bg-tech-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {isLoadingMetricas ? 'Calculando...' : 'Aplicar Filtros'}
                </button>
              </div>
            </div>

            {/* Tarjetas KPI de Resumen Académico */}
            {metricasData && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Horas de Práctica Efectiva</p>
                  <p className="text-2xl font-bold font-poppins text-tech-blue mt-1">
                    {metricasData.totalHorasCampus} hrs
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">En el período seleccionado</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Tasa de Asistencia Global</p>
                  <p className="text-2xl font-bold font-poppins text-emerald-600 mt-1">
                    {metricasData.tasaAsistenciaPromedio}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Aprovechamiento de aforo</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Estudiantes Beneficiados</p>
                  <p className="text-2xl font-bold font-poppins text-indigo-600 mt-1">
                    {metricasData.totalAlumnosBeneficiados}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Alumnos que cursaron prácticas</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Laboratorio Top Demanda</p>
                  <p className="text-xl font-bold font-poppins text-slate-900 dark:text-white mt-1 truncate" title={metricasData.laboratorioMasDemandado}>
                    {metricasData.laboratorioMasDemandado}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Mayor número de solicitudes</p>
                </div>
              </div>
            )}

            {/* Tabla Detallada por Laboratorio */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
                    <tr>
                      <th className="px-6 py-4 font-bold">Laboratorio</th>
                      <th className="px-6 py-4 font-bold">Capacidad</th>
                      <th className="px-6 py-4 font-bold">Total Reservas</th>
                      <th className="px-6 py-4 font-bold">Asistidas</th>
                      <th className="px-6 py-4 font-bold">Inasistencias</th>
                      <th className="px-6 py-4 font-bold">Horas de Uso</th>
                      <th className="px-6 py-4 font-bold">Tasa Asistencia</th>
                      <th className="px-6 py-4 font-bold">Estudiantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingMetricas ? (
                      <tr><td colSpan={8} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>
                    ) : !metricasData || metricasData.laboratorios.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">No hay registros de uso en el rango seleccionado</td></tr>
                    ) : (
                      metricasData.laboratorios.map((lab) => (
                        <tr key={lab.laboratorioId} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 dark:text-white">{lab.nombre}</p>
                            <p className="text-xs text-slate-500">{lab.ubicacion}</p>
                          </td>
                          <td className="px-6 py-4">{lab.capacidad} Asientos</td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{lab.totalReservas}</td>
                          <td className="px-6 py-4 text-emerald-600 font-semibold">{lab.reservasAsistidas}</td>
                          <td className="px-6 py-4 text-rose-500 font-semibold">{lab.reservasAusentes}</td>
                          <td className="px-6 py-4 font-mono font-bold text-tech-blue">{lab.horasUsoEfectivo} hrs</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              lab.tasaAsistencia >= 80
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : lab.tasaAsistencia >= 50
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}>
                              {lab.tasaAsistencia}%
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{lab.alumnosBeneficiados}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Registrar Nuevo Feriado / Bloqueo (HU-29) */}
      {isFeriadoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-tech-blue" />
                Registrar Feriado o Día Bloqueado
              </h2>
              <button onClick={() => setIsFeriadoModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearFeriado} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha a Bloquear <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={feriadoForm.fecha}
                  onChange={(e) => setFeriadoForm({ ...feriadoForm, fecha: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo Institucional o Causa de Cierre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Aniversario de la Facultad, Día del Estudiante..."
                  value={feriadoForm.motivo}
                  onChange={(e) => setFeriadoForm({ ...feriadoForm, motivo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-tech-blue focus:outline-none dark:text-white"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                ℹ️ Al guardar, ningún docente ni estudiante podrá reservar laboratorios en esta fecha.
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFeriadoModalOpen(false)}
                  disabled={isSubmittingFeriado}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeriado}
                  className="px-5 py-2 text-sm font-bold text-white bg-tech-blue hover:bg-blue-600 disabled:opacity-50 rounded-xl shadow transition flex items-center"
                >
                  {isSubmittingFeriado ? 'Guardando...' : 'Guardar Feriado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Programar Mantenimiento (HU-11) */}
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

      {/* Modal Cancelar por Fuerza Mayor (HU-19) */}
      {isFuerzaMayorModalOpen && reservaAFuerzaMayor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
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
                <p><strong>Docente:</strong> {reservaAFuerzaMayor.usuario?.nombreCompleto}</p>
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
                  placeholder="Detalla el imprevisto institucional (ej. corte eléctrico no programado, filtración de agua, evento urgente)..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                Se notificará formalmente al usuario y se liberará el laboratorio.
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFuerzaMayorModalOpen(false)}
                  disabled={isSubmittingFuerzaMayor}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFuerzaMayor}
                  className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow transition flex items-center"
                >
                  {isSubmittingFuerzaMayor ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rechazar Reserva con Motivo Obligatorio (HU-17) */}
      {isRechazarModalOpen && reservaARechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                Rechazar Reserva
              </h2>
              <button onClick={() => setIsRechazarModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRechazo} className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Indica el motivo de rechazo para la reserva de <strong>{reservaARechazar.usuario.nombreCompleto}</strong> en <strong>{reservaARechazar.laboratorio.nombre}</strong>:
                </p>
                <textarea
                  required
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej. Conflicto de horario con mantenimiento, aforo no adecuado, día no lectivo..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRechazarModalOpen(false)}
                  disabled={isSubmittingRechazo}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRechazo}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition"
                >
                  {isSubmittingRechazo ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
                {modalMode === 'crear' ? 'Nuevo Laboratorio' : `Editar: ${formData.nombre}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="labForm" onSubmit={handleSubmit} className="space-y-5">
                <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Laboratorio</label><input type="text" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Capacidad Total</label><input type="number" min="1" required value={formData.capacidad} onChange={e => setFormData({ ...formData, capacidad: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" /></div>
                  <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Carrera Propietaria</label><select required value={formData.carreraId} onChange={e => setFormData({ ...formData, carreraId: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"><option value="" disabled>Seleccionar...</option>{carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                </div>
                <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ubicación / Aula</label><input type="text" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" /></div>

                {/* CAMPOS: Estado e Imagen con Vista Previa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado Operativo</label>
                    <select value={formData.estadoOperativo} onChange={e => setFormData({ ...formData, estadoOperativo: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none">
                      <option value="Activo">Activo</option>
                      <option value="En Mantenimiento">En Mantenimiento</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">URL de Fotografía (Opcional)</label>
                    <input type="text" value={formData.imagenUrl} onChange={e => setFormData({ ...formData, imagenUrl: e.target.value })} placeholder="https://ejemplo.com/foto.jpg" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" />
                  </div>
                </div>

                {formData.imagenUrl && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <img
                      src={formData.imagenUrl}
                      alt="Vista previa"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fotografía cargada</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm">{formData.imagenUrl}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input type="checkbox" id="reservaMode" checked={formData.reservaPorComputadora} onChange={e => setFormData({ ...formData, reservaPorComputadora: e.target.checked })} className="w-5 h-5 text-tech-blue rounded border-gray-300 focus:ring-tech-blue" />
                  <label htmlFor="reservaMode" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">¿Las reservas son individuales por computadora? <br /><span className="text-xs text-slate-500 font-normal">Si se desmarca, se reserva la sala completa.</span></label>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/80">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button type="submit" form="labForm" className="px-6 py-2.5 rounded-xl font-bold bg-umss-blue hover:bg-blue-800 text-white shadow-md transition-colors">{modalMode === 'crear' ? 'Guardar Laboratorio' : 'Guardar Cambios'}</button>
            </div>
          </div>
        </div>
      )}


      {/* Omitidos los otros modales (Schedule y Equip) para brevedad del regex, asumiendo que estaban igual que en mi script anterior y funcionando. ¡Espera, los escribo rápido para no romper la app entera! */}
      {isEquipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div><h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center"><Server className="w-5 h-5 mr-2 text-tech-blue" /> Equipamiento</h2><p className="text-sm text-slate-500 dark:text-slate-400">Gestionando: {selectedLabName}</p></div>
              <button onClick={() => setIsEquipModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isEquipLoading ? (
                <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Añadir Equipo</h3>
                    <form onSubmit={handleAddEquip} className="space-y-4">
                      <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catálogo</label><select required value={equipForm.equipamientoId} onChange={e => setEquipForm({ ...equipForm, equipamientoId: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"><option value="" disabled>Seleccione un equipo...</option>{equiposBase.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.tipo})</option>)}</select></div>
                      <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cantidad</label><input type="number" min="1" required value={equipForm.cantidad} onChange={e => setEquipForm({ ...equipForm, cantidad: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none" /></div>
                      <button type="submit" className="w-full bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-colors">Vincular Equipo</button>
                    </form>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Inventario Actual</h3>
                    {currentLabEquipos.length > 0 ? (
                      <ul className="space-y-3">{currentLabEquipos.map((eq, i) => (<li key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700"><div><p className="font-bold text-sm text-slate-900 dark:text-white">{eq.equipamiento.nombre}</p><p className="text-xs text-slate-500">{eq.equipamiento.tipo}</p></div><span className="bg-umss-blue text-white px-2 py-1 rounded-lg text-xs font-bold">x{eq.cantidad}</span></li>))}</ul>
                    ) : (<p className="text-sm text-slate-500 italic">No hay equipos asignados.</p>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div><h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center"><Clock className="w-5 h-5 mr-2 text-indigo-500" /> Horarios de Apertura</h2><p className="text-sm text-slate-500 dark:text-slate-400">Laboratorio: {selectedLabName}</p></div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Activa los días que el laboratorio estará abierto y define su franja horaria.</p>
              {scheduleForm.map((diaInfo, index) => (
                <div key={diaInfo.dia} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${diaInfo.activo ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'}`}>
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0"><input type="checkbox" checked={diaInfo.activo} onChange={() => handleToggleDay(index)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer" /><span className={`font-bold ${diaInfo.activo ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>{diaInfo.dia}</span></div>
                  <div className="flex items-center space-x-2"><input type="time" disabled={!diaInfo.activo} value={diaInfo.horaApertura} onChange={(e) => handleChangeTime(index, 'horaApertura', e.target.value)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500" /><span className="text-slate-400">-</span><input type="time" disabled={!diaInfo.activo} value={diaInfo.horaCierre} onChange={(e) => handleChangeTime(index, 'horaCierre', e.target.value)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500" /></div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/80">
              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button type="button" onClick={handleSaveSchedule} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aplicar Sanción Disciplinaria Manual (HU-33) */}
      {isManualSancionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
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
                  <option value="" disabled>Seleccione un usuario...</option>
                  {usuariosList.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombreCompleto} ({u.correo}) - {u.rol?.nombre}</option>
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
                <p className="text-[11px] text-slate-400 mt-1">24 horas por inasistencia estándar, o hasta 720 horas (30 días) para sanciones graves.</p>
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
                  placeholder="Detalla el motivo institucional (ej. uso indebido de equipamiento, inasistencia reiterada, daño a periféricos)..."
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

      {/* Modal Levantar / Perdonar Sanción (HU-33) */}
      {isPerdonarModalOpen && sancionAPerdonar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
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