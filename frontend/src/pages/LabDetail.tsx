import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import ReservaComputadoraModal from '../components/ReservaComputadoraModal';
import toast from 'react-hot-toast';
import SolicitudReservaModal from '../components/SolicitudReservaModal';
import LabDetailHeader, { type Laboratorio } from '../components/laboratorios/LabDetailHeader';
import LabDetailSidebar, { type HorarioItem } from '../components/laboratorios/LabDetailSidebar';
import LabDetailCalendar, { type ReservaLab, type BloqueEvaluado } from '../components/laboratorios/LabDetailCalendar';

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
  const [reservas, setReservas] = useState<ReservaLab[]>([]);
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
      const resCal = await apiClient.get(`/api/laboratorios/${id}/calendario`);
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
      const resLab = await apiClient.get(`/api/laboratorios/${id}`);
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

  // Horario operativo institucional / personalizado
  const tieneHorariosPersonalizados = horarios.length > 0;
  const esDomingo = fechaObj.getDay() === 0;
  const esSabado = fechaObj.getDay() === 6;

  let horaAperturaLab = '06:45';
  let horaCierreLab = esSabado ? '12:45' : '21:45';
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
  const bloquesEvaluados: BloqueEvaluado[] = BLOQUES_ACADEMICOS.map((bloque) => {
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

    // Verificar solapamiento con reservas registradas
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
    if (puedeReservarComputadora) {
      setMostrarReserva(true);
    } else {
      setIsModalReservaOpen(true);
    }
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] font-inter transition-colors duration-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Botón de Regreso */}
        <Link to="/" className="inline-flex items-center space-x-2 text-slate-500 hover:text-tech-blue dark:text-slate-400 dark:hover:text-blue-400 font-semibold text-xs mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </Link>

        {/* Encabezado del Laboratorio */}
        <LabDetailHeader
          lab={lab}
          puedeReservarComputadora={puedeReservarComputadora}
          onReservarComputadora={() => {
            setModalInitialParams({
              fecha: fechaSeleccionada,
              horaInicio: '08:15',
              horaFin: '09:45'
            });
            setMostrarReserva(true);
          }}
          onReservarLaboratorio={handleAbrirReservaGeneral}
        />

        {/* Dos Columnas: Equipamiento/Ubicación y Agenda Interactiva */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <LabDetailSidebar
            lab={lab}
            horarios={horarios}
            getHorarioTimeStr={getHorarioTimeStr}
            onReservarGeneral={handleAbrirReservaGeneral}
          />

          <LabDetailCalendar
            reservas={reservas}
            vistaAgenda={vistaAgenda}
            setVistaAgenda={setVistaAgenda}
            fechaSeleccionada={fechaSeleccionada}
            setFechaSeleccionada={setFechaSeleccionada}
            hoyStr={hoyStr}
            diaSemanaNombre={diaSemanaNombre}
            diaSel={diaSel}
            mesSel={mesSel}
            añoSel={añoSel}
            totalDisponibles={totalDisponibles}
            totalOcupados={totalOcupados}
            feriadoDelDia={feriadoDelDia}
            mantenimientoDelDia={mantenimientoDelDia}
            laboratorioOperaHoy={laboratorioOperaHoy}
            bloquesEvaluados={bloquesEvaluados}
            onCambiarDia={handleCambiarDia}
            onAbrirReservaBloque={handleAbrirReservaBloque}
          />
        </div>
      </div>

      {puedeReservarComputadora && (
        <ReservaComputadoraModal
          abierto={mostrarReserva}
          laboratorioId={lab.id}
          laboratorioNombre={lab.nombre}
          cantidadComputadoras={cantidadComputadoras}
          initialFecha={modalInitialParams.fecha || fechaSeleccionada}
          initialHoraInicio={modalInitialParams.horaInicio || '08:15'}
          initialHoraFin={modalInitialParams.horaFin || '09:45'}
          onCerrar={() => {
            setMostrarReserva(false);
            setModalInitialParams({});
          }}
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