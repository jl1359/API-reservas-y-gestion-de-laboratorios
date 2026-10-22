import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  MapPin,
  Users,
  Monitor,
  Box,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  CheckCircle2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CalendarDays,
  ListFilter,
  Wrench,
  Navigation
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ReservaComputadoraModal from '../components/ReservaComputadoraModal';
import toast from 'react-hot-toast';
import SolicitudReservaModal from '../components/SolicitudReservaModal';

interface Equipamiento {
  id: number;
  nombre: string;
  tipo: string;
}

interface LabEquipo {
  cantidad: number;
  equipamiento: Equipamiento;
}

interface HorarioItem {
  id: number;
  dia: string;
  horaApertura: string;
  horaCierre: string;
}

interface FeriadoItem {
  id: number;
  fecha: string;
  motivo: string;
}

interface MantenimientoItem {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
}

interface Laboratorio {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string | null;
  latitud?: number | null;
  longitud?: number | null;
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
  motivo?: string;
  materia?: string;
  tipo?: string;
  numeroComputadora?: number | null;
  usuario: { nombreCompleto: string };
}

// Bloques académicos estándar de 90 minutos (Sistema Universitario FCyT / UMSS)
const BLOQUES_ACADEMICOS = [
  { id: 1, etiqueta: 'Periodo 1', inicio: '06:45', fin: '08:15' },
  { id: 2, etiqueta: 'Periodo 2', inicio: '08:15', fin: '09:45' },
  { id: 3, etiqueta: 'Periodo 3', inicio: '09:45', fin: '11:15' },
  { id: 4, etiqueta: 'Periodo 4', inicio: '11:15', fin: '12:45' },
  { id: 5, etiqueta: 'Periodo 5', inicio: '12:45', fin: '14:15' },
  { id: 6, etiqueta: 'Periodo 6', inicio: '14:15', fin: '15:45' },
  { id: 7, etiqueta: 'Periodo 7', inicio: '15:45', fin: '17:15' },
  { id: 8, etiqueta: 'Periodo 8', inicio: '17:15', fin: '18:45' },
  { id: 9, etiqueta: 'Periodo 9', inicio: '18:45', fin: '20:15' },
  { id: 10, etiqueta: 'Periodo 10', inicio: '20:15', fin: '21:45' }
];

const DIAS_SEMANA_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function LabDetail() {
  const { id } = useParams();
  const [lab, setLab] = useState<Laboratorio | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [horarios, setHorarios] = useState<HorarioItem[]>([]);
  const [feriados, setFeriados] = useState<FeriadoItem[]>([]);
  const [mantenimientos, setMantenimientos] = useState<MantenimientoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [calendarioVersion, setCalendarioVersion] = useState(0);
  const [isModalReservaOpen, setIsModalReservaOpen] = useState(false);

  // Selector interactivo de fecha y modo de visualización
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr);
  const [vistaAgenda, setVistaAgenda] = useState<'bloques' | 'lista'>('bloques');

  // Parámetros para prellenar el modal de reserva al hacer clic en un bloque libre
  const [modalInitialParams, setModalInitialParams] = useState<{
    fecha?: string;
    horaInicio?: string;
    horaFin?: string;
  }>({});

  const fetchReservas = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resCal = await axios.get(`http://localhost:3000/api/laboratorios/${id}/calendario`, { headers });
      setReservas(resCal.data.reservas || []);
      setHorarios(resCal.data.horarios || []);
      setFeriados(resCal.data.feriados || []);
      setMantenimientos(resCal.data.mantenimientos || []);
    } catch (error) {
      console.error('Error al consultar calendario:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const resLab = await axios.get(`http://localhost:3000/api/laboratorios/${id}`, { headers });
      if (resLab.data.success) {
        setLab(resLab.data.data);
      }

      await fetchReservas();
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar la información del laboratorio');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, calendarioVersion]);

  // Cálculos de disponibilidad en tiempo real para la fecha seleccionada
  const normalizarTexto = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Formateador de fecha local YYYY-MM-DD
  const getLocalDateStr = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.split('T')[0];
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Formateador de hora local HH:mm para reservas
  const getLocalTimeStr = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(0, 5);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Formateador de horarios operativos de laboratorio
  const getHorarioTimeStr = (isoString?: string) => {
    if (!isoString) return '';
    if (isoString.includes('T')) {
      return isoString.split('T')[1].slice(0, 5);
    }
    return isoString.slice(0, 5);
  };

  const [añoSel, mesSel, diaSel] = fechaSeleccionada.split('-').map(Number);
  const fechaObj = new Date(añoSel, mesSel - 1, diaSel);
  const diaSemanaNombre = DIAS_SEMANA_MAP[fechaObj.getDay()];

  // Verificar si la fecha seleccionada es feriado institucional
  const feriadoDelDia = feriados.find((f) => {
    const fFecha = getLocalDateStr(f.fecha);
    return fFecha === fechaSeleccionada || f.fecha.split('T')[0] === fechaSeleccionada;
  });

  // Verificar si hay mantenimiento técnico en este laboratorio
  const mantenimientoDelDia = mantenimientos.find((m) => {
    const mIni = getLocalDateStr(m.fechaInicio);
    const mFin = getLocalDateStr(m.fechaFin);
    return fechaSeleccionada >= mIni && fechaSeleccionada <= mFin;
  });

  // Horario operativo: si el lab no tiene horarios personalizados configurados,
  // se aplican los turnos institucionales universitarios (Lun-Vie 06:45-21:45, Sáb 06:45-13:00)
  const tieneHorariosPersonalizados = horarios.length > 0;
  const esDomingo = fechaObj.getDay() === 0;
  const esSabado = fechaObj.getDay() === 6;

  let horaAperturaLab = '06:45';
  let horaCierreLab = esSabado ? '13:00' : '21:45';
  let laboratorioOperaHoy = !esDomingo;

  const horarioDelDia = tieneHorariosPersonalizados
    ? horarios.find((h) => normalizarTexto(h.dia) === normalizarTexto(diaSemanaNombre))
    : undefined;

  if (tieneHorariosPersonalizados) {
    if (horarioDelDia) {
      horaAperturaLab = getHorarioTimeStr(horarioDelDia.horaApertura);
      horaCierreLab = getHorarioTimeStr(horarioDelDia.horaCierre);
      laboratorioOperaHoy = true;
    } else {
      laboratorioOperaHoy = false;
    }
  }

  // Filtrar reservas que coinciden con el día seleccionado (usando hora local)
  const reservasDelDia = reservas.filter((r) => {
    const fInicio = getLocalDateStr(r.fechaInicio);
    const fFin = getLocalDateStr(r.fechaFin);
    return fechaSeleccionada >= fInicio && fechaSeleccionada <= fFin;
  });

  // Evaluación de cada bloque académico
  const bloquesEvaluados = BLOQUES_ACADEMICOS.map((bloque) => {
    const dentroDeHorario =
      laboratorioOperaHoy &&
      bloque.inicio >= horaAperturaLab &&
      bloque.fin <= horaCierreLab;

    if (feriadoDelDia) {
      return {
        ...bloque,
        estado: 'FERIADO' as const,
        motivoOcupacion: `Feriado Oficial: ${feriadoDelDia.motivo}`,
        dentroDeHorario
      };
    }

    if (mantenimientoDelDia) {
      return {
        ...bloque,
        estado: 'MANTENIMIENTO' as const,
        motivoOcupacion: `Mantenimiento: ${mantenimientoDelDia.motivo}`,
        dentroDeHorario
      };
    }

    if (!dentroDeHorario) {
      return {
        ...bloque,
        estado: 'FUERA_HORARIO' as const,
        motivoOcupacion: 'Fuera de turno operativo',
        dentroDeHorario
      };
    }

    // Verificar solapamiento con reservas registradas (en hora local)
    const reservaEnBloque = reservasDelDia.find((r) => {
      const horaInicioRes = getLocalTimeStr(r.fechaInicio);
      const horaFinRes = getLocalTimeStr(r.fechaFin);
      return horaInicioRes < bloque.fin && horaFinRes > bloque.inicio;
    });

    if (reservaEnBloque) {
      return {
        ...bloque,
        estado: 'OCUPADO' as const,
        reserva: reservaEnBloque,
        motivoOcupacion: reservaEnBloque.materia || reservaEnBloque.motivo || 'Sesión Reservada',
        docente: reservaEnBloque.usuario?.nombreCompleto || 'Docente Asignado',
        estadoReserva: reservaEnBloque.estado,
        dentroDeHorario
      };
    }

    return {
      ...bloque,
      estado: 'DISPONIBLE' as const,
      motivoOcupacion: null,
      dentroDeHorario
    };
  });

  const totalDisponibles = bloquesEvaluados.filter((b) => b.estado === 'DISPONIBLE').length;
  const totalOcupados = bloquesEvaluados.filter((b) => b.estado === 'OCUPADO').length;

  const handleCambiarDia = (delta: number) => {
    const [y, m, d] = fechaSeleccionada.split('-').map(Number);
    const date = new Date(y, m - 1, d + delta);
    setFechaSeleccionada(date.toISOString().split('T')[0]);
  };

  const handleAbrirReservaBloque = (bloqueInicio: string, bloqueFin: string) => {
    setModalInitialParams({
      fecha: fechaSeleccionada,
      horaInicio: bloqueInicio,
      horaFin: bloqueFin
    });
    setIsModalReservaOpen(true);
  };

  const handleAbrirReservaGeneral = () => {
    setModalInitialParams({
      fecha: fechaSeleccionada,
      horaInicio: '08:15',
      horaFin: '09:45'
    });
    setIsModalReservaOpen(true);
  };

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
          <Link to="/" className="text-tech-blue hover:underline">Volver al catálogo</Link>
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

            {puedeReservarComputadora ? (
              <button
                type="button"
                onClick={() => setMostrarReserva(true)}
                className="w-full md:w-auto bg-tech-blue hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all shadow-blue-500/30"
              >
                Reservar computadora
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAbrirReservaGeneral}
                className="w-full md:w-auto bg-tech-blue hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all shadow-blue-500/30 cursor-pointer"
              >
                Reservar Laboratorio
              </button>
            )}

          </div>
        </div>

        {/* Dos Columnas: Equipamiento y Agenda Interactiva */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Equipamiento y Acciones Rápidas */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Box className="w-5 h-5 mr-2 text-tech-blue" />
                Equipamiento Disponible
              </h2>
              
              {lab.equipos && lab.equipos.length > 0 ? (
                <ul className="space-y-3">
                  {lab.equipos.map((eq, i) => (
                    <li key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{eq.equipamiento.nombre}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{eq.equipamiento.tipo}</p>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                        x{eq.cantidad}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-xs">No hay equipos registrados para este laboratorio.</p>
              )}
            </div>

            
            {/* Ubicación y Mapa Interactivo del Campus FCyT (HU-31) */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-rose-500" />
                  Ubicación en el Campus
                </h2>
                {lab.latitud && lab.longitud && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                    {Number(lab.latitud).toFixed(4)}, {Number(lab.longitud).toFixed(4)}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                {lab.ubicacion || 'Campus Central de la Facultad de Ciencias y Tecnología (FCyT) - UMSS'}
              </p>

              {lab.latitud && lab.longitud ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative h-48 bg-slate-100 dark:bg-slate-900">
                  <iframe
                    title="Mapa de Ubicación Campus FCyT"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lab.longitud) - 0.003}%2C${Number(lab.latitud) - 0.002}%2C${Number(lab.longitud) + 0.003}%2C${Number(lab.latitud) + 0.002}&layer=mapnik&marker=${lab.latitud}%2C${lab.longitud}`}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-center text-xs text-slate-400">
                  Coordenadas geográficas no configuradas para este espacio.
                </div>
              )}

              {lab.latitud && lab.longitud && (
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${lab.latitud},${lab.longitud}&travelmode=walking`;
                    window.open(url, '_blank');
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 text-xs transition-all hover:scale-[1.01]"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Cómo llegar (Navegación a pie)</span>
                </button>
              )}
            </div>

            {/* Acción Rápida de Reserva */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center">
                <CalendarPlus className="w-4 h-4 mr-2 text-tech-blue" />
                Reserva de Instalaciones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Docentes y auxiliares pueden agendar el uso exclusivo del laboratorio para el dictado de sus materias.
              </p>
              <button
                onClick={handleAbrirReservaGeneral}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <CalendarPlus className="w-5 h-5" />
                <span>Reservar Laboratorio</span>
              </button>
            </div>

            {/* Resumen de Horarios Semanales */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-tech-blue" />
                Horarios Operativos
              </h3>
              {horarios.length > 0 ? (
                <div className="space-y-1.5">
                  {horarios.map((h) => (
                    <div key={h.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{h.dia}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {getHorarioTimeStr(h.horaApertura)} - {getHorarioTimeStr(h.horaCierre)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Lunes a Viernes:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">06:45 - 21:45</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábados:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">06:45 - 13:00</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Calendario y Disponibilidad en Tiempo Real */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              
              {/* Encabezado y Alternancia de Vistas */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-tech-blue" />
                    Calendario de Disponibilidad
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Consulta los bloques horarios libres y ocupados en tiempo real.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Tiempo Real
                  </span>
                  <div className="bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setVistaAgenda('bloques')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center ${
                        vistaAgenda === 'bloques'
                          ? 'bg-white dark:bg-slate-800 text-tech-blue shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5 mr-1" />
                      Bloques
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaAgenda('lista')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center ${
                        vistaAgenda === 'lista'
                          ? 'bg-white dark:bg-slate-800 text-tech-blue shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <ListFilter className="w-3.5 h-3.5 mr-1" />
                      Sesiones ({reservas.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de Navegación de Fechas (Día Anterior, Selector y Día Siguiente) */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-700/70">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleCambiarDia(-1)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Día anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <input
                      type="date"
                      value={fechaSeleccionada}
                      onChange={(e) => setFechaSeleccionada(e.target.value)}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-tech-blue"
                    />

                    <button
                      type="button"
                      onClick={() => handleCambiarDia(1)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Día siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setFechaSeleccionada(hoyStr)}
                      className="px-3 py-2 text-xs font-bold text-tech-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition"
                    >
                      Hoy
                    </button>
                  </div>

                  {/* Resumen del Día Seleccionado */}
                  <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide mr-2">
                      {diaSemanaNombre}, {diaSel}/{mesSel}/{añoSel}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {totalDisponibles} Libres
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      {totalOcupados} Ocupados
                    </span>
                  </div>
                </div>

                {/* Banner de Advertencia si es Feriado */}
                {feriadoDelDia && (
                  <div className="mt-3.5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Feriado Oficial Institucional:</strong> {feriadoDelDia.motivo}. El campus permanece cerrado.
                    </span>
                  </div>
                )}

                {/* Banner de Advertencia si está en Mantenimiento */}
                {mantenimientoDelDia && (
                  <div className="mt-3.5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300">
                    <Wrench className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Mantenimiento Técnico:</strong> {mantenimientoDelDia.motivo}. Las actividades se encuentran suspendidas.
                    </span>
                  </div>
                )}

                {/* Banner de Advertencia si el Laboratorio no atiende este día */}
                {!feriadoDelDia && !mantenimientoDelDia && !laboratorioOperaHoy && (
                  <div className="mt-3.5 p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                    Este laboratorio no atiende los días <strong>{diaSemanaNombre}</strong>.
                  </div>
                )}
              </div>

              {/* VISTA 1: MATRIZ DE BLOQUES ACADÉMICOS EN TIEMPO REAL */}
              {vistaAgenda === 'bloques' && (
                <div className="space-y-3">
                  {bloquesEvaluados.map((bloque) => {
                    const isDisponible = bloque.estado === 'DISPONIBLE';
                    const isOcupado = bloque.estado === 'OCUPADO';
                    const isFeriado = bloque.estado === 'FERIADO';
                    const isMantenimiento = bloque.estado === 'MANTENIMIENTO';

                    return (
                      <div
                        key={bloque.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                          isDisponible
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-400'
                            : isOcupado
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
                            : isMantenimiento || isFeriado
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
                            : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        {/* Bloque y Rango Horario */}
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          <div className={`p-2.5 rounded-xl ${
                            isDisponible
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : isOcupado
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                              : isMantenimiento
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : isFeriado
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {isMantenimiento ? <Wrench className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {bloque.etiqueta}
                              </span>
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {bloque.inicio} - {bloque.fin}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {isDisponible && 'Espacio disponible para reserva académica'}
                              {isOcupado && `${bloque.motivoOcupacion} · Docente: ${bloque.docente}`}
                              {!isDisponible && !isOcupado && bloque.motivoOcupacion}
                            </p>
                          </div>
                        </div>

                        {/* Estado y Acción */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                          {isDisponible && (
                            <button
                              type="button"
                              onClick={() => handleAbrirReservaBloque(bloque.inicio, bloque.fin)}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Reservar Bloque
                            </button>
                          )}

                          {isOcupado && (
                            <span className="px-3 py-1 text-xs font-bold rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Ocupado ({bloque.estadoReserva})
                            </span>
                          )}

                          {isMantenimiento && (
                            <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center">
                              <Wrench className="w-3 h-3 mr-1" /> Mantenimiento
                            </span>
                          )}

                          {isFeriado && (
                            <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Feriado
                            </span>
                          )}

                          {!isDisponible && !isOcupado && !isMantenimiento && !isFeriado && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-500">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISTA 2: LISTA CRONOLÓGICA DE PRÓXIMAS SESIONES */}
              {vistaAgenda === 'lista' && (
                <>
                  {reservas.length > 0 ? (
                    <div className="space-y-4">
                      {reservas.map((reserva) => {
                        const start = new Date(reserva.fechaInicio);
                        const end = new Date(reserva.fechaFin);
                        return (
                          <div
                            key={reserva.id}
                            className="flex flex-col md:flex-row md:items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 gap-4"
                          >
                            {/* Fecha Badge */}
                            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-center w-20">
                              <p className="text-xs font-bold text-slate-400 uppercase">
                                {start.toLocaleString('es-ES', { month: 'short' })}
                              </p>
                              <p className="text-xl font-extrabold text-umss-blue dark:text-blue-400 leading-none">
                                {start.getDate()}
                              </p>
                            </div>

                            {/* Info Reserva */}
                            <div className="flex-1">
                              <p className="font-bold text-slate-900 dark:text-white text-base">
                                {reserva.materia || reserva.motivo || 'Sesión de Laboratorio'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Reservado por: {reserva.usuario.nombreCompleto}
                              </p>
                            </div>

                            {/* Horario */}
                            <div className="flex-shrink-0 text-right md:border-l border-slate-200 dark:border-slate-700 md:pl-4">
                              <div className="flex items-center justify-end text-slate-700 dark:text-slate-300 font-semibold text-xs">
                                <Clock className="w-3.5 h-3.5 mr-1.5 text-tech-blue" />
                                {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <span
                                className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded font-bold ${
                                  reserva.estado === 'Aprobada'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}
                              >
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
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        No hay reservas registradas en el sistema para este laboratorio.
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Todos los turnos operativos se encuentran disponibles.
                      </p>
                    </div>
                  )}
                </>
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
          onReservaCreada={() => {
            setCalendarioVersion((version) => version + 1);
            fetchReservas();
          }}
        />
      )}

      {lab && (
        <SolicitudReservaModal
          isOpen={isModalReservaOpen}
          onClose={() => setIsModalReservaOpen(false)}
          laboratorio={lab}
          onReservaExitosa={fetchReservas}
          initialFecha={modalInitialParams.fecha}
          initialHoraInicio={modalInitialParams.horaInicio}
          initialHoraFin={modalInitialParams.horaFin}
        />
      )}

    </div>
  );
}
