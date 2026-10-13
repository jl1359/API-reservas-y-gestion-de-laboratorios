import { useState, useEffect } from 'react';
import { User, Shield, Key, Send, AlertTriangle, Calendar, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [misReservas, setMisReservas] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rol = localStorage.getItem('userRole') || 'Usuario';
    setUsuario({ rol });

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

    // Cargar mis reservas
    const fetchMisReservas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('http://localhost:3000/api/reservas/mis-reservas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMisReservas(res.data.data || []);
      } catch (error) {
        console.error('Error al cargar mis reservas', error);
      }
    };

    fetchRoles();
    fetchMisReservas();
  }, []);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-poppins font-bold text-slate-900 dark:text-white mb-8">Mi Perfil</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-24 h-24 bg-tech-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-tech-blue" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Mi Cuenta</h2>
              <span className="inline-block bg-umss-blue text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
                Rol: {usuario?.rol || 'Desconocido'}
              </span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {usuario?.rol === 'Estudiante' && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center"><Shield className="w-5 h-5 mr-2 text-tech-blue" /> Solicitar Permisos</h3>
                <form onSubmit={solicitarRol}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rol Solicitado</label>
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
                  <textarea rows={3} required value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Justifica por qué necesitas este rol..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none mb-4 resize-none"></textarea>
                  <button type="submit" disabled={isSubmitting} className="bg-tech-blue hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center">
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center"><Key className="w-5 h-5 mr-2 text-tech-blue" /> Seguridad</h3>
              <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-6 py-2.5 rounded-xl font-bold">Cambiar Contraseña</button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 shadow-sm border border-red-200 dark:border-red-900/30">
              <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Zona de Peligro</h3>
              <p className="text-red-600 dark:text-red-300/80 text-sm mb-6">Acción irreversible.</p>
              <button onClick={eliminarCuenta} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold">Eliminar mi cuenta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}