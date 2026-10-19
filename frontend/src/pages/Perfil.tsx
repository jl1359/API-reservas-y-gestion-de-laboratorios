import { useState, useEffect } from 'react';
import { User, Shield, Key, Send, AlertTriangle, Calendar, QrCode, Clock, MapPin, Monitor, CheckCircle, AlertCircle } from 'lucide-react';

import Navbar from '../components/Navbar';
import ModalQrReserva from '../components/ModalQrReserva';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  const [motivo, setMotivo] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reservas
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);

  const [isLoadingReservas, setIsLoadingReservas] = useState(true);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [isModalQrOpen, setIsModalQrOpen] = useState(false);
  const [sancionActiva, setSancionActiva] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const rol = localStorage.getItem('userRole') || 'Usuario';
    setUsuario({ rol });

    // Consultar estado disciplinario de sanciones (HU-30)
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

    // Cargar roles disponibles
    const fetchRoles = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/roles');
        setRoles(res.data);
        if (res.data.length > 0) {
          setRolSeleccionado(res.data[0].nombre);
        }
      } catch (error) {
        console.error('Error al cargar roles', error);
      }
    };

    // Cargar mis reservas (HU-22)
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

    fetchSancionEstado();

    fetchRoles();
    fetchMisReservas();
  }, []);

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
        
        {/* Cabecera del Perfil */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
          <div className="w-20 h-20 bg-tech-blue/10 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-tech-blue dark:text-blue-400" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-slate-900 dark:text-white">
              Panel de Usuario
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Administra tus reservas activas, códigos de acceso y credenciales de usuario.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-block bg-umss-blue text-white px-3 py-1 rounded-full text-xs font-bold">
                Rol: {usuario?.rol || 'Estudiante'}
              </span>
            </div>
          </div>
        </div>

        {/* ALERTA VISIBLE DE SANCIÓN ACTIVA (HU-30) */}
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
                  Caduca en: {sancionActiva.horasRestantes}h {sancionActiva.minutosRestantes}m
                </span>
              </div>
              <h2 className="text-lg font-poppins font-bold text-rose-900 dark:text-rose-200">
                Tus privilegios de reserva están suspendidos temporalmente
              </h2>
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                Se detectó una falta de inasistencia en una reserva previa sin registro oportuno de código QR. Conforme a las normas del campus (HU-30), tu cuenta no puede generar nuevas reservas hasta el{' '}
                <span className="font-bold underline">{new Date(sancionActiva.fechaFin).toLocaleString('es-ES')}</span>.
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 italic bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
                Detalle oficial: {sancionActiva.motivo}
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

        {/* CONTENIDO PESTAÑA 1: MIS RESERVAS (HU-22) */}
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
                          {reserva.laboratorio.nombre}
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

                      {/* Botón de QR o Estado */}
                      <div className="flex-shrink-0 flex items-center justify-end">
                        {esAprobada ? (
                          <button
                            onClick={() => abrirQr(reserva)}
                            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/20 transition-all text-sm"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Ver Código QR</span>
                          </button>
                        ) : reserva.estado === 'Pendiente' ? (
                          <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span>El QR se habilitará al ser aprobada</span>
                          </div>
                        ) : null}
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
            {usuario?.rol === 'Estudiante' && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-tech-blue" /> Solicitar Permisos
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Si eres Docente o Auxiliar, solicita el escalamiento de tu rol al Administrador.
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

            {/* Sección Mis Reservas HU-15 / HU-16 / HU-17 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-tech-blue" /> Mis Reservas de Laboratorio
              </h3>
              
              {misReservas.length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                  <p className="text-sm font-medium">No tienes solicitudes de reserva registradas actualmente.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Puedes solicitar una reserva desde la página de detalle de cualquier laboratorio.
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
                          <p className="font-bold text-slate-900 dark:text-white">{res.laboratorio.nombre}</p>
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
                Puedes cambiar tu contraseña mediante el enlace de restablecimiento seguro.
              </p>
              <button 
                onClick={() => toast.success('Para cambiar tu contraseña, utiliza la opción "Olvidé mi contraseña" en la pantalla de inicio.')}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-6 py-2.5 rounded-xl font-bold text-sm"
              >
                Cambiar Contraseña
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 shadow-sm border border-red-200 dark:border-red-900/30">
              <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> Zona de Peligro
              </h3>
              <p className="text-red-600 dark:text-red-300/80 text-sm mb-6">
                Esta acción es irreversible y eliminará todos tus registros y accesos personales.
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

      {/* Modal QR Oficial de la Reserva (HU-22) */}
      <ModalQrReserva
        isOpen={isModalQrOpen}
        onClose={() => setIsModalQrOpen(false)}
        reserva={reservaSeleccionada}
      />
    </div>
  );
}