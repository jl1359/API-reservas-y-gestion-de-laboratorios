import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  Send,
  AlertTriangle,
  Calendar,
  QrCode,
  Clock,
  MapPin,
  Monitor,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Save,
  XCircle,
  FileText,
  CalendarPlus,
  ExternalLink,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

import Navbar from '../components/Navbar';
import ModalQrReserva from '../components/ModalQrReserva';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usuariosApi } from '../api/usuarios.api';
import { reservasApi } from '../api/reservas.api';
import { generarEnlaceGoogleCalendar, descargarArchivoIcs } from '../utils/calendar';
import { imprimirBoletaOficial } from '../utils/boletaPdf';

interface Reserva {
  id: number;
  tokenQr?: string | null;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
  materia?: string | null;
  numeroComputadora?: number | null;
  estado: string;
  horaAsistencia?: string | null;
  laboratorio: {
    nombre: string;
    ubicacion?: string | null;
    reservaPorComputadora?: boolean;
  };
}

export default function Perfil() {
  const [activeTab, setActiveTab] = useState<'reservas' | 'cuenta'>('reservas');
  const [usuario, setUsuario] = useState<any>(null);
  const [perfilNombre, setPerfilNombre] = useState('');
  const [perfilTelefono, setPerfilTelefono] = useState('');
  const [perfilCi, setPerfilCi] = useState('');
  const [perfilCarreraId, setPerfilCarreraId] = useState('');
  const [carreras, setCarreras] = useState<any[]>([]);
  const [isGuardandoPerfil, setIsGuardandoPerfil] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [misReservas, setMisReservas] = useState<Reserva[]>([]);

  const [isLoadingReservas, setIsLoadingReservas] = useState(true);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [isModalQrOpen, setIsModalQrOpen] = useState(false);
  const [sancionActiva, setSancionActiva] = useState<any>(null);
  const [isCancelarModalOpen, setIsCancelarModalOpen] = useState(false);
  const [reservaACancelar, setReservaACancelar] = useState<Reserva | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [isSubmittingCancelacion, setIsSubmittingCancelacion] = useState(false);

  // Estados y logica para cambiar contrasena directamente desde el perfil
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPasswords, setMostrarPasswords] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const navigate = useNavigate();

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordActual.trim()) {
      return toast.error('Ingresa tu contraseña actual');
    }
    if (nuevaPassword.length < 8) {
      return toast.error('La nueva contraseña debe tener al menos 8 caracteres');
    }
    if (nuevaPassword !== confirmarPassword) {
      return toast.error('Las contraseñas no coinciden');
    }

    setIsSubmittingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        'http://localhost:3000/api/auth/cambiar-password',
        { passwordActual, nuevaPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data?.mensaje || 'Contraseña actualizada correctamente');
      setIsPasswordModalOpen(false);
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const fetchMisReservas = async () => {
    try {
      setIsLoadingReservas(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:3000/api/reservas/mis-reservas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMisReservas(res.data.reservas || res.data.data || []);
    } catch (error) {
      console.error('Error al cargar mis reservas', error);
    } finally {
      setIsLoadingReservas(false);
    }
  };

  useEffect(() => {
    const rol = localStorage.getItem('userRole') || 'Usuario';
    setUsuario({ rol });

    const fetchPerfil = async () => {
      try {
        const data = await usuariosApi.obtenerMiPerfil();
        if (data) {
          setUsuario(data);
          setPerfilNombre(data.nombreCompleto || '');
          setPerfilTelefono(data.telefono || '');
          setPerfilCi(data.ci || '');
          setPerfilCarreraId(data.carreraId ? String(data.carreraId) : (data.carrera?.id ? String(data.carrera.id) : ''));
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err);
      }
    };

    const fetchSancionEstado = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/sanciones/mi-estado', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data.estaSancionado) {
          setSancionActiva(res.data.data.sancionActiva);
        } else {
          setSancionActiva(null);
        }
      } catch (err) {
        console.error('Error al consultar estado de sanción:', err);
      }
    };

    const fetchRoles = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/roles');
        const rolesData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRoles(rolesData);
        if (rolesData.length > 0) {
          setRolSeleccionado(rolesData[0].nombre);
        }
      } catch (error) {
        console.error('Error al cargar roles', error);
      }
    };

    const fetchCarreras = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/carreras');
        setCarreras(res.data || []);
      } catch (err) {
        console.error('Error al cargar carreras', err);
      }
    };

    fetchCarreras();
    fetchPerfil();
    fetchSancionEstado();
    fetchRoles();
    fetchMisReservas();
  }, []);

  const nombreRol = typeof usuario?.rol === 'object' && usuario?.rol !== null
    ? (usuario.rol.nombre || 'Estudiante')
    : (typeof usuario?.rol === 'string' ? usuario.rol : (localStorage.getItem('userRole') || 'Estudiante'));


  const abrirQr = (reserva: Reserva) => {
    setReservaSeleccionada(reserva);
    setIsModalQrOpen(true);
  };

  const solicitarRol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return toast.error('Debes escribir un motivo');
    if (!rolSeleccionado) return toast.error('Debes seleccionar un rol');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/roles/request', { motivo, rolSolicitado: rolSeleccionado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Solicitud enviada correctamente al Administrador');
      setMotivo('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGuardandoPerfil(true);
    try {
      const actualizado = await usuariosApi.actualizarPerfil({
        nombreCompleto: perfilNombre.trim(),
        telefono: perfilTelefono?.trim() || null,
        ci: perfilCi?.trim() || null,
        carreraId: perfilCarreraId ? Number(perfilCarreraId) : null
      });
      setUsuario(actualizado);
      toast.success('Información de perfil actualizada exitosamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setIsGuardandoPerfil(false);
    }
  };

    const handleAbrirCancelar = (reserva: Reserva) => {
    setReservaACancelar(reserva);
    setMotivoCancelacion('');
    setIsCancelarModalOpen(true);
  };

  const handleConfirmarCancelacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaACancelar) return;
    if (motivoCancelacion.trim().length < 5) {
      return toast.error('Ingresa una justificación formal de al menos 5 caracteres');
    }
    setIsSubmittingCancelacion(true);
    try {
      await reservasApi.cancelarReservaPropia(reservaACancelar.id, motivoCancelacion.trim());
      toast.success('Reserva cancelada exitosamente y horario liberado');
      setIsCancelarModalOpen(false);
      setReservaACancelar(null);
      setMotivoCancelacion('');
      fetchMisReservas();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cancelar la reserva');
    } finally {
      setIsSubmittingCancelacion(false);
    }
  };

  const eliminarCuenta = async () => {
    if (!window.confirm('¿ESTÁS SEGURO? Esta acción es irreversible y eliminará todos tus datos.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:3000/api/auth/eliminar-cuenta', {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cuenta eliminada exitosamente');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar la cuenta');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter transition-colors duration-200">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Cabecera del Perfil con Datos Reales del Usuario */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
          <div className="w-20 h-20 bg-tech-blue/10 dark:bg-blue-900/30 text-tech-blue dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 font-poppins font-bold text-2xl">
            {usuario?.nombreCompleto ? usuario.nombreCompleto.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-slate-900 dark:text-white">
              {usuario?.nombreCompleto || 'Usuario FCyT'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
              {usuario?.correo && (
                <span className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {usuario.correo}
                </span>
              )}
              {usuario?.telefono && (
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {usuario.telefono}
                </span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center bg-umss-blue text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                <Shield className="w-3 h-3 mr-1" />
                Rol: {nombreRol}
              </span>
              <span className="inline-flex items-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-600">
                Carrera: {usuario?.carrera?.nombre || 'Facultad de Ciencias y Tecnología'}
              </span>
              {usuario?.ci && (
                <span className="inline-flex items-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-600">
                  CI: {usuario.ci}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ALERTA VISIBLE DE SANCIÓN ACTIVA */}
        {sancionActiva && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 shadow-sm animate-in fade-in duration-200">
            <div className="p-3 bg-rose-500 text-white rounded-2xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Sanción Disciplinaria Activa (24 Horas)
                </span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Caduca en: {sancionActiva.horasRestantes ?? 0}h {sancionActiva.minutosRestantes ?? 0}m
                </span>
              </div>
              <h2 className="text-lg font-poppins font-bold text-rose-900 dark:text-rose-200">
                Cuenta suspendida temporalmente
              </h2>
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                Sanción por inasistencia previa sin aviso. Podrás volver a reservar el{' '}
                <span className="font-bold underline">{sancionActiva.fechaFin ? new Date(sancionActiva.fechaFin).toLocaleString('es-ES') : ''}</span>.
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 italic bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
                Motivo: {sancionActiva.motivo || 'Inasistencia a reserva'}
              </p>
            </div>
          </div>
        )}

        {/* Selector de Pestañas */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 mb-8">
          <button
            onClick={() => setActiveTab('reservas')}
            className={`pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'reservas'
                ? 'border-tech-blue text-tech-blue dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mis Reservas ({misReservas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cuenta')}
            className={`pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'cuenta'
                ? 'border-tech-blue text-tech-blue dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Configuración de Cuenta</span>
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: MIS RESERVAS */}
        {activeTab === 'reservas' && (
          <div>
            {isLoadingReservas ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-blue mx-auto mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando reservas...</p>
              </div>
            ) : misReservas.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Aún no tienes reservas registradas</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
                  Explora el catálogo de laboratorios para agendar un aula o puesto de computadora.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-6 bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all text-sm"
                >
                  Ver Catálogo de Laboratorios
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {misReservas.map((reserva) => {
                  const inicio = new Date(reserva.fechaInicio);
                  const fin = new Date(reserva.fechaFin);
                  const esAprobada = reserva.estado === 'Aprobada';
                  const yaAsistio = reserva.estado === 'Asistió';

                  return (
                    <div
                      key={reserva.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              esAprobada
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : yaAsistio
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : reserva.estado === 'Pendiente'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            }`}
                          >
                            {reserva.estado}
                          </span>

                          {reserva.numeroComputadora && (
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full flex items-center">
                              <Monitor className="w-3 h-3 mr-1" /> PC #{reserva.numeroComputadora}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
                          {reserva.laboratorio?.nombre || 'Laboratorio'}
                        </h3>

                        <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {reserva.laboratorio.ubicacion && (
                            <span className="flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {reserva.laboratorio.ubicacion}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {inicio.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}{' '}
                            ({inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>

                        {reserva.motivo && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 italic">
                            Motivo: "{reserva.motivo}"
                          </p>
                        )}

                        {yaAsistio && reserva.horaAsistencia && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2 flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Asistencia registrada:{' '}
                            {new Date(reserva.horaAsistencia).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      {/* Botones de Acción (QR, Boleta PDF, Calendarios y Cancelación) */}
                      <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-2">
                        {esAprobada && (
                          <>
                            <button
                              onClick={() => abrirQr(reserva)}
                              className="flex items-center justify-center space-x-1.5 bg-tech-blue hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-xl shadow-sm transition-all text-xs"
                              title="Ver pase QR de ingreso"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>QR</span>
                            </button>

                            <button
                              onClick={() => imprimirBoletaOficial({
                                ...reserva,
                                usuario: {
                                  nombreCompleto: usuario?.nombreCompleto || usuario?.nombre || 'Usuario UMSS',
                                  correo: usuario?.correo || '',
                                  ci: usuario?.ci || null
                                }
                              })}
                              className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-2 px-3 rounded-xl transition-all text-xs"
                              title="Imprimir o descargar boleta oficial en PDF"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Boleta PDF</span>
                            </button>

                            <button
                              onClick={() => window.open(generarEnlaceGoogleCalendar(reserva), '_blank')}
                              className="flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 px-2.5 rounded-xl transition-all text-xs"
                              title="Agregar a Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Google Cal</span>
                            </button>

                            <button
                              onClick={() => descargarArchivoIcs(reserva)}
                              className="flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 px-2.5 rounded-xl transition-all text-xs"
                              title="Descargar archivo iCalendar (.ics) para Outlook, iPhone o Apple Calendar"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Outlook / iCal</span>
                            </button>
                          </>
                        )}

                        {reserva.estado === 'Pendiente' && (
                          <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span>Pendiente de aprobación</span>
                          </div>
                        )}

                        {(reserva.estado === 'Pendiente' || reserva.estado === 'Aprobada') && (
                          <button
                            onClick={() => handleAbrirCancelar(reserva)}
                            className="flex items-center justify-center space-x-1.5 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold py-2 px-3 rounded-xl transition-all text-xs"
                            title="Cancelar esta reserva con justificación formal"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: CONFIGURACIÓN Y SEGURIDAD */}
        {activeTab === 'cuenta' && (
          <div className="space-y-6">
            {/* Información de Perfil Complementaria */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                <User className="w-5 h-5 mr-2 text-tech-blue" /> Información Personal
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Datos personales y de contacto.
              </p>
              <form onSubmit={guardarPerfil} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={perfilNombre}
                      onChange={(e) => setPerfilNombre(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-tech-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={perfilTelefono}
                      onChange={(e) => setPerfilTelefono(e.target.value)}
                      placeholder="+591 71234567"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-tech-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      type="text"
                      value={perfilCi}
                      onChange={(e) => setPerfilCi(e.target.value)}
                      placeholder="Ej. 8472912"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-tech-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> Correo electronico
                    </label>
                    <p className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                      {usuario?.correo || 'Cargando...'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Carrera Académica
                    </label>
                    <select
                      value={perfilCarreraId}
                      onChange={(e) => setPerfilCarreraId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-tech-blue"
                    >
                      <option value="">Facultad de Ciencias y Tecnología</option>
                      {carreras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isGuardandoPerfil}
                    className="bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center text-sm shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <span>{isGuardandoPerfil ? 'Guardando...' : 'Guardar Datos'}</span>
                  </button>
                </div>
              </form>
            </div>
            {nombreRol === 'Estudiante' && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-tech-blue" /> Solicitar Permisos
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Solicitud de cambio de rol al Administrador.
                </p>
                <form onSubmit={solicitarRol}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Rol Solicitado
                    </label>
                    <select
                      value={rolSeleccionado}
                      onChange={(e) => setRolSeleccionado(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                    >
                      {roles.map((r: any) => (
                        <option key={r.id} value={r.nombre}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Justifica por qué necesitas este rol..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none mb-4 resize-none"
                  ></textarea>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-tech-blue hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" /> {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </div>
            )}

            {/* Sección Mis Reservas */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-tech-blue" /> Mis Reservas de Laboratorio
              </h3>

              {misReservas.length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                  <p className="text-sm font-medium">No tienes reservas registradas actualmente.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Puedes realizar una reserva desde la página de detalle de cualquier laboratorio.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {misReservas.map((res: any) => {
                    const start = new Date(res.fechaInicio);
                    const end = new Date(res.fechaFin);
                    const estadoEstilo =
                      res.estado === 'Aprobada'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200'
                        : res.estado === 'Pendiente'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';

                    return (
                      <div key={res.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{res.laboratorio?.nombre || 'Laboratorio'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Materia: <strong className="text-slate-700 dark:text-slate-300">{res.materia || 'Práctica'}</strong> • {res.cantidadAlumnos || 1} alumnos
                          </p>
                          <p className="text-xs text-slate-400 flex items-center mt-1">
                            <Clock className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                            {start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}, {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {res.motivo && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              Nota: {res.motivo}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${estadoEstilo}`}>
                            {res.estado}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                <Key className="w-5 h-5 mr-2 text-tech-blue" /> Seguridad
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Actualiza tu clave de acceso periódicamente.
              </p>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="bg-tech-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Cambiar Contraseña</span>
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 shadow-sm border border-red-200 dark:border-red-900/30">
              <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> Zona de Peligro
              </h3>
              <p className="text-red-600 dark:text-red-300/80 text-sm mb-6">
                Acción irreversible. Se eliminarán tu cuenta y reservas asociadas.
              </p>
              <button
                onClick={eliminarCuenta}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm"
              >
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        )}

      </div>

            {/* Modal de Cancelación con Justificación Obligatoria */}
      {isCancelarModalOpen && reservaACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-rose-500" />
                Cancelar Reserva
              </h2>
              <button
                onClick={() => setIsCancelarModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarCancelacion} className="mt-4 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-xs space-y-1 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {reservaACancelar.laboratorio.nombre}
                </p>
                <p className="text-slate-500">
                  {new Date(reservaACancelar.fechaInicio).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indica el motivo de cancelación para liberar el turno a otros estudiantes.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de Cancelación <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Ej. Cruce imprevisto de horario académico, reprogramación de práctica, etc."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelarModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancelacion}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmittingCancelacion ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña Directo */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-tech-blue" />
                Cambiar Contraseña
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordActual('');
                  setNuevaPassword('');
                  setConfirmarPassword('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCambiarPassword} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define tu nueva contraseña (mínimo 8 caracteres).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña Actual <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={mostrarPasswords ? 'text' : 'password'}
                    required
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    placeholder="Tu contraseña actual"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswords(!mostrarPasswords)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={mostrarPasswords ? 'Ocultar' : 'Mostrar'}
                  >
                    {mostrarPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña <span className="text-rose-500">*</span>
                </label>
                <input
                  type={mostrarPasswords ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Nueva Contraseña <span className="text-rose-500">*</span>
                </label>
                <input
                  type={mostrarPasswords ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordActual('');
                    setNuevaPassword('');
                    setConfirmarPassword('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2 text-xs font-bold text-white bg-tech-blue hover:bg-blue-600 rounded-xl disabled:opacity-50 shadow-md transition-all flex items-center space-x-1.5"
                >
                  {isSubmittingPassword ? (
                    <span>Guardando...</span>
                  ) : (
                    <span>Guardar Contraseña</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Oficial de la Reserva */}
      <ModalQrReserva
        isOpen={isModalQrOpen}
        onClose={() => setIsModalQrOpen(false)}
        reserva={reservaSeleccionada}
      />
    </div>
  );
}
