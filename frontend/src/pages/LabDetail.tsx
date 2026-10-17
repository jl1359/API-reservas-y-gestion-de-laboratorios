import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Users, Monitor, Box, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import ReservaComputadoraModal from '../components/ReservaComputadoraModal';
import toast from 'react-hot-toast';

interface Equipamiento {
  id: number;
  nombre: string;
  tipo: string;
}

interface LabEquipo {
  cantidad: number;
  equipamiento: Equipamiento;
}

interface Laboratorio {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string | null;
  imagenUrl: string | null;
  reservaPorComputadora: boolean;
  equipos: LabEquipo[];
  carrera: { nombre: string } | null;
}

interface Reserva {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  motivo: string;
  usuario: { nombreCompleto: string };
}

export default function LabDetail() {
  const { id } = useParams();
  const [lab, setLab] = useState<Laboratorio | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [calendarioVersion, setCalendarioVersion] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Obtener detalles del laboratorio
        const resLab = await axios.get(`http://localhost:3000/api/laboratorios/${id}`, { headers });
        if (resLab.data.success) {
          setLab(resLab.data.data);
        }

        // Obtener calendario/reservas
        const resCal = await axios.get(`http://localhost:3000/api/laboratorios/${id}/calendario`, { headers });
        setReservas(resCal.data.reservas || []);

      } catch (error) {
        console.error(error);
        toast.error('Error al cargar la información del laboratorio');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, calendarioVersion]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-blue"></div>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
          <p className="text-xl font-bold mb-4">Laboratorio no encontrado</p>
          <Link to="/" className="text-tech-blue hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const computadorasRegistradas = lab.equipos
    .filter(({ equipamiento }) => equipamiento.nombre.toLocaleLowerCase().includes('computadora'))
    .reduce((total, equipo) => total + equipo.cantidad, 0);
  const cantidadComputadoras = computadorasRegistradas || lab.capacidad;
  const puedeReservarComputadora =
    lab.reservaPorComputadora && localStorage.getItem('userRole') === 'Estudiante';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter transition-colors duration-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Botón de Regreso */}
        <Link to="/" className="inline-flex items-center space-x-2 text-slate-500 hover:text-tech-blue dark:text-slate-400 dark:hover:text-blue-400 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al catálogo</span>
        </Link>

        {/* Encabezado del Laboratorio */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-start mb-8 transition-colors">
          <div className="w-full md:w-1/3 h-64 bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden relative flex-shrink-0">
            {lab.imagenUrl ? (
              <img src={lab.imagenUrl} alt={lab.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-umss-blue to-tech-blue opacity-90 flex items-center justify-center">
                <Monitor className="w-24 h-24 text-white/50" />
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-3">
              {lab.carrera ? lab.carrera.nombre : 'Uso General'}
            </div>
            <h1 className="text-3xl md:text-4xl font-poppins font-bold text-slate-900 dark:text-white mb-4">
              {lab.nombre}
            </h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <Users className="w-5 h-5 text-tech-blue mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Capacidad</p>
                <p className="font-bold text-slate-900 dark:text-white">{lab.capacidad} asientos</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <MapPin className="w-5 h-5 text-tech-blue mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Ubicación</p>
                <p className="font-bold text-slate-900 dark:text-white">{lab.ubicacion || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <Monitor className="w-5 h-5 text-tech-blue mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Modalidad</p>
                <p className="font-bold text-slate-900 dark:text-white truncate" title={lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}>
                  {lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}
                </p>
              </div>
            </div>

            {puedeReservarComputadora && (
              <button
                type="button"
                onClick={() => setMostrarReserva(true)}
                className="w-full md:w-auto bg-tech-blue hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all shadow-blue-500/30"
              >
                Reservar computadora
              </button>
            )}
          </div>
        </div>

        {/* Dos Columnas: Equipamiento y Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Equipamiento */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Box className="w-5 h-5 mr-2 text-tech-blue" />
                Equipamiento
              </h2>
              
              {lab.equipos && lab.equipos.length > 0 ? (
                <ul className="space-y-4">
                  {lab.equipos.map((eq, i) => (
                    <li key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{eq.equipamiento.nombre}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{eq.equipamiento.tipo}</p>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-bold">
                        x{eq.cantidad}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No hay equipos registrados para este laboratorio.</p>
              )}
            </div>
          </div>

          {/* Columna Derecha: Agenda / Reservas */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-tech-blue" />
                  Agenda Activa
                </h2>
                <span className="text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Tiempo Real
                </span>
              </div>

              {reservas.length > 0 ? (
                <div className="space-y-4">
                  {reservas.map(reserva => {
                    const start = new Date(reserva.fechaInicio);
                    const end = new Date(reserva.fechaFin);
                    return (
                      <div key={reserva.id} className="flex flex-col md:flex-row md:items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 gap-4">
                        
                        {/* Fecha Badge */}
                        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-center w-20">
                          <p className="text-xs font-bold text-slate-400 uppercase">{start.toLocaleString('es-ES', { month: 'short' })}</p>
                          <p className="text-xl font-extrabold text-umss-blue dark:text-blue-400 leading-none">{start.getDate()}</p>
                        </div>
                        
                        {/* Info Reserva */}
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-lg">{reserva.motivo || 'Sesión de Laboratorio'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Reservado por: {reserva.usuario.nombreCompleto}</p>
                        </div>
                        
                        {/* Horario */}
                        <div className="flex-shrink-0 text-right md:border-l border-slate-200 dark:border-slate-700 md:pl-4">
                          <div className="flex items-center justify-end text-slate-700 dark:text-slate-300 font-semibold">
                            <Clock className="w-4 h-4 mr-1.5 text-tech-blue" />
                            {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded font-bold ${reserva.estado === 'Aprobada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {reserva.estado}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No hay reservas programadas próximamente.</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Este laboratorio está completamente libre.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {puedeReservarComputadora && (
        <ReservaComputadoraModal
          abierto={mostrarReserva}
          laboratorioId={lab.id}
          laboratorioNombre={lab.nombre}
          cantidadComputadoras={cantidadComputadoras}
          onCerrar={() => setMostrarReserva(false)}
          onReservaCreada={() => setCalendarioVersion(version => version + 1)}
        />
      )}
    </div>
  );
}
