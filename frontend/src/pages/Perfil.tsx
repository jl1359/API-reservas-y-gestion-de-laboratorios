import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  AlertTriangle,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';

import Navbar from '../components/Navbar';
import ModalQrReserva from '../components/ModalQrReserva';
import ModalCancelarReserva from '../components/perfil/ModalCancelarReserva';
import ModalCambiarPassword from '../components/perfil/ModalCambiarPassword';
import ListaMisReservasPerfil, { type ReservaPerfil } from '../components/perfil/ListaMisReservasPerfil';
import TabCuentaPerfil from '../components/perfil/TabCuentaPerfil';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usuariosApi } from '../api/usuarios.api';
import { reservasApi } from '../api/reservas.api';

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

  const [misReservas, setMisReservas] = useState<ReservaPerfil[]>([]);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaPerfil | null>(null);
  const [isModalQrOpen, setIsModalQrOpen] = useState(false);
  const [sancionActiva, setSancionActiva] = useState<any>(null);
  const [isCancelarModalOpen, setIsCancelarModalOpen] = useState(false);
  const [reservaACancelar, setReservaACancelar] = useState<ReservaPerfil | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [isSubmittingCancelacion, setIsSubmittingCancelacion] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const navigate = useNavigate();

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

  const abrirQr = (reserva: ReservaPerfil) => {
    setReservaSeleccionada(reserva);
    setIsModalQrOpen(true);
  };

  const handleAbrirCancelar = (reserva: ReservaPerfil) => {
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] font-inter transition-colors duration-200">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Cabecera del Perfil con Datos Reales del Usuario */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-8 transition-all">
          <div className="w-20 h-20 bg-tech-blue/10 dark:bg-blue-900/30 text-tech-blue dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 font-poppins font-bold text-2xl border border-tech-blue/20">
            {usuario?.nombreCompleto ? usuario.nombreCompleto.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-slate-900 dark:text-white">
              {usuario?.nombreCompleto || 'Usuario FCyT'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
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
              <span className="inline-flex items-center bg-tech-blue/10 text-tech-blue dark:text-blue-400 border border-tech-blue/20 px-3 py-1 rounded-full text-xs font-semibold">
                <Shield className="w-3 h-3 mr-1" />
                Rol: {nombreRol}
              </span>
              <span className="inline-flex items-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
                Carrera: {usuario?.carrera?.nombre || 'Facultad de Ciencias y Tecnología'}
              </span>
              {usuario?.ci && (
                <span className="inline-flex items-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
                  CI: {usuario.ci}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ALERTA VISIBLE DE SANCIÓN ACTIVA */}
        {sancionActiva && (
          <div className="bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 shadow-xs animate-in fade-in duration-200">
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
          <ListaMisReservasPerfil
            isLoading={isLoadingReservas}
            reservas={misReservas}
            usuario={usuario}
            onAbrirQr={abrirQr}
            onAbrirCancelar={handleAbrirCancelar}
            onVerCatalogo={() => navigate('/')}
          />
        )}

        {/* CONTENIDO PESTAÑA 2: CONFIGURACIÓN Y SEGURIDAD */}
        {activeTab === 'cuenta' && (
          <TabCuentaPerfil
            usuario={usuario}
            nombreRol={nombreRol}
            perfilNombre={perfilNombre}
            setPerfilNombre={setPerfilNombre}
            perfilTelefono={perfilTelefono}
            setPerfilTelefono={setPerfilTelefono}
            perfilCi={perfilCi}
            setPerfilCi={setPerfilCi}
            perfilCarreraId={perfilCarreraId}
            setPerfilCarreraId={setPerfilCarreraId}
            carreras={carreras}
            isGuardandoPerfil={isGuardandoPerfil}
            onGuardarPerfil={guardarPerfil}
            roles={roles}
            rolSeleccionado={rolSeleccionado}
            setRolSeleccionado={setRolSeleccionado}
            motivo={motivo}
            setMotivo={setMotivo}
            isSubmittingSolicitud={isSubmitting}
            onSolicitarRol={solicitarRol}
            misReservas={misReservas}
            onAbrirPasswordModal={() => setIsPasswordModalOpen(true)}
            onEliminarCuenta={eliminarCuenta}
          />
        )}
      </div>

      {/* Modal de Cancelación con Justificación Obligatoria */}
      <ModalCancelarReserva
        isOpen={isCancelarModalOpen}
        onClose={() => setIsCancelarModalOpen(false)}
        reserva={reservaACancelar}
        motivoCancelacion={motivoCancelacion}
        setMotivoCancelacion={setMotivoCancelacion}
        onSubmit={handleConfirmarCancelacion}
        isSubmitting={isSubmittingCancelacion}
      />

      {/* Modal Cambiar Contraseña */}
      <ModalCambiarPassword
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Modal QR Oficial de la Reserva */}
      <ModalQrReserva
        isOpen={isModalQrOpen}
        onClose={() => setIsModalQrOpen(false)}
        reserva={reservaSeleccionada}
      />
    </div>
  );
}