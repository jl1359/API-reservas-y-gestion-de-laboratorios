import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Monitor, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  RefreshCw, 
  Printer, 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  Building2,
  GraduationCap,
  PieChart, 
  BarChart3, 
  Download,
  CalendarRange,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface UsuarioReserva {
  id: number;
  nombreCompleto: string;
  correo: string;
  carrera?: { id: number; nombre: string } | null;
}

interface LaboratorioReserva {
  id: number;
  nombre: string;
  ubicacion: string | null;
  carreraId?: number | null;
  carrera?: { id: number; nombre: string } | null;
}

interface ReservaReporte {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  horaAsistencia: string | null;
  numeroComputadora: number | null;
  usuario: UsuarioReserva;
  laboratorio: LaboratorioReserva;
}

interface MetricaCarrera {
  id: number | null;
  nombre: string;
  total: number;
  porcentaje: number;
}

interface MetricaLaboratorio {
  id: number;
  nombre: string;
  total: number;
  porcentaje: number;
}

interface MetricaDia {
  fecha: string;
  diaSemana: string;
  total: number;
  porcentaje: number;
}

interface ResumenReporte {
  totalReservas: number;
  asistenciasRegistradas: number;
  inasistenciasRegistradas: number;
  porEstado: Record<string, number>;
  porCarrera?: MetricaCarrera[];
  carreraMasDemandada?: MetricaCarrera | null;
  porLaboratorio?: MetricaLaboratorio[];
  laboratorioMasReservado?: MetricaLaboratorio | null;
  porDia?: MetricaDia[];
  diaMasReservado?: MetricaDia | null;
}

interface ReporteData {
  fecha: string;
  fechaFin?: string | null;
  esRango?: boolean;
  zonaHoraria: string;
  criterio: string;
  laboratorioId: number | null;
  resumen: ResumenReporte;
  reservas: ReservaReporte[];
}

interface LaboratorioOpcion {
  id: number;
  nombre: string;
  carreraId?: number | null;
  carrera?: { id: number; nombre: string } | null;
}

interface CarreraOpcion {
  id: number;
  nombre: string;
}

// Configuración de colores para los estados
const COLORES_ESTADOS: Record<string, { bg: string; fill: string; hex: string; stroke: string }> = {
  'Asistió': { bg: 'bg-emerald-500', fill: 'fill-emerald-500', hex: '#10b981', stroke: '#059669' },
  'Aprobada': { bg: 'bg-blue-500', fill: 'fill-blue-500', hex: '#0284c7', stroke: '#0369a1' },
  'Ausente': { bg: 'bg-rose-500', fill: 'fill-rose-500', hex: '#f43f5e', stroke: '#e11d48' },
  'Cancelada': { bg: 'bg-slate-400', fill: 'fill-slate-400', hex: '#94a3b8', stroke: '#64748b' },
  'Pendiente': { bg: 'bg-amber-500', fill: 'fill-amber-500', hex: '#f59e0b', stroke: '#d97706' },
  'Completada': { bg: 'bg-purple-500', fill: 'fill-purple-500', hex: '#a855f7', stroke: '#9333ea' }
};

// Paleta armónica para carreras, laboratorios y días
const PALETA_COLORES = [
  '#2563eb', // azul royal
  '#7c3aed', // violeta
  '#db2777', // frambuesa
  '#ea580c', // naranja intenso
  '#059669', // verde esmeralda
  '#0891b2', // cian océano
  '#d97706', // ámbar
  '#4f46e5', // índigo
  '#0d9488', // verde azulado
  '#64748b'  // gris pizarra
];

export default function ReporteAsistencias() {
  const hoyStr = new Date().toISOString().slice(0, 10);
  
  // Modo de auditoría: 'dia' (específico) o 'rango' (intervalo de fechas)
  const [modoAuditoria, setModoAuditoria] = useState<'dia' | 'rango'>('dia');
  const [fecha, setFecha] = useState<string>(hoyStr);
  const [fechaInicio, setFechaInicio] = useState<string>(hoyStr);
  const [fechaFin, setFechaFin] = useState<string>(hoyStr);

  const [carreraId, setCarreraId] = useState<string>('');
  const [carreras, setCarreras] = useState<CarreraOpcion[]>([]);
  const [laboratorioId, setLaboratorioId] = useState<string>('');
  const [todosLosLaboratorios, setTodosLosLaboratorios] = useState<LaboratorioOpcion[]>([]);
  const [laboratorios, setLaboratorios] = useState<LaboratorioOpcion[]>([]);
  
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [tabAnalitica, setTabAnalitica] = useState<'integral' | 'carreras' | 'labs' | 'dias' | 'estados' | 'horarios'>('integral');
  const [formatoGraficoCarreras, setFormatoGraficoCarreras] = useState<'pastel' | 'barras'>('pastel');
  const [formatoGraficoLabs, setFormatoGraficoLabs] = useState<'pastel' | 'barras'>('pastel');
  const [formatoGraficoDias, setFormatoGraficoDias] = useState<'barras' | 'pastel'>('barras');

  // Cargar lista de laboratorios y carreras
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resLabs, resCarreras] = await Promise.all([
          axios.get('http://localhost:3000/api/laboratorios', { headers }),
          axios.get('http://localhost:3000/api/carreras', { headers }).catch(() => ({ data: [] }))
        ]);

        if (resLabs.data?.success && Array.isArray(resLabs.data.data)) {
          const labsMapeados = resLabs.data.data.map((l: any) => ({
            id: l.id,
            nombre: l.nombre,
            carreraId: l.carreraId || (l.carrera ? l.carrera.id : null),
            carrera: l.carrera || null
          }));
          setTodosLosLaboratorios(labsMapeados);
          setLaboratorios(labsMapeados);
        }

        const carrData = Array.isArray(resCarreras.data) ? resCarreras.data : (resCarreras.data?.data || []);
        setCarreras(carrData);
      } catch (err) {
        console.error('Error al cargar filtros:', err);
      }
    };
    fetchData();
  }, []);

  // Filtrar laboratorios dinámicamente cuando cambia la carrera seleccionada
  useEffect(() => {
    if (!carreraId) {
      setLaboratorios(todosLosLaboratorios);
    } else {
      const cId = Number(carreraId);
      const filtrados = todosLosLaboratorios.filter((l) => l.carreraId === cId);
      setLaboratorios(filtrados);
      if (laboratorioId && !filtrados.some((l) => l.id === Number(laboratorioId))) {
        setLaboratorioId('');
      }
    }
  }, [carreraId, todosLosLaboratorios]);

  // Aplicar atajos rápidos de fechas
  const aplicarPreset = (tipo: 'hoy' | 'ultimos7' | 'esteMes' | 'proximos30') => {
    const ahora = new Date();
    const formato = (d: Date) => d.toISOString().slice(0, 10);
    
    if (tipo === 'hoy') {
      const hoy = formato(ahora);
      setFechaInicio(hoy);
      setFechaFin(hoy);
    } else if (tipo === 'ultimos7') {
      const pasada = new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000);
      setFechaInicio(formato(pasada));
      setFechaFin(formato(ahora));
    } else if (tipo === 'esteMes') {
      const primero = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const ultimo = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
      setFechaInicio(formato(primero));
      setFechaFin(formato(ultimo));
    } else if (tipo === 'proximos30') {
      const futuro = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
      setFechaInicio(formato(ahora));
      setFechaFin(formato(futuro));
    }
  };

  // Consultar reporte de auditoría
  const consultarReporte = useCallback(async (mostrarFeedback = false) => {
    try {
      if (mostrarFeedback) setIsRefreshing(true);
      else setIsLoading(true);

      const token = localStorage.getItem('token');
      const params: Record<string, string> = {};

      if (modoAuditoria === 'dia') {
        if (!fecha) {
          toast.error('Selecciona una fecha válida');
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        params.fecha = fecha;
      } else {
        if (!fechaInicio || !fechaFin) {
          toast.error('Indica fecha de inicio y fecha fin');
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        if (fechaInicio > fechaFin) {
          toast.error('La fecha de inicio no puede ser posterior a la fecha fin');
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        params.fecha = fechaInicio;
        params.fechaFin = fechaFin;
      }

      if (laboratorioId) {
        params.laboratorioId = laboratorioId;
      }
      if (carreraId) {
        params.carreraId = carreraId;
      }

      const res = await axios.get('http://localhost:3000/api/reportes/asistencias', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setReporte(res.data);
      if (mostrarFeedback) {
        toast.success('Reporte de auditoría actualizado');
      }
    } catch (err: any) {
      console.error('Error al consultar reporte:', err);
      const msg = err.response?.data?.error || 'No se pudo obtener el reporte';
      toast.error(msg);
      setReporte(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [modoAuditoria, fecha, fechaInicio, fechaFin, laboratorioId, carreraId]);

  useEffect(() => {
    consultarReporte();
  }, [consultarReporte]);

  // Formateador de horas (HH:mm)
  const formatearHora = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  // Formateador de fecha corta (DD/MM/AAAA)
  const formatearFecha = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoDate.slice(0, 10);
    }
  };

  // Formateador de fecha/hora completa de asistencia
  const formatearHoraExacta = (isoDate: string | null) => {
    if (!isoDate) return null;
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoDate;
    }
  };

  // Exportar Dataset compatible con Power BI (CSV estructurado con BOM UTF-8)
  const exportarDatasetPowerBI = () => {
    if (!reporte?.reservas || reporte.reservas.length === 0) {
      toast.error('No hay datos disponibles para exportar en este período');
      return;
    }

    const encabezados = [
      'ID_Reserva',
      'Fecha',
      'Hora_Inicio',
      'Hora_Fin',
      'Carrera_Laboratorio',
      'Laboratorio',
      'Ubicacion',
      'Usuario_Titular',
      'Correo_Usuario',
      'Carrera_Usuario',
      'Modalidad',
      'Numero_Computadora',
      'Estado_Reserva',
      'Asistencia_Registrada',
      'Hora_Ingreso_QR'
    ];

    const filas = reporte.reservas.map(r => {
      const fechaReserva = r.fechaInicio.slice(0, 10);
      const horaIni = formatearHora(r.fechaInicio);
      const horaFin = formatearHora(r.fechaFin);
      const carreraLab = (r.laboratorio?.carrera?.nombre || 'General / Sin Asignar').replace(/"/g, '""');
      const carreraUser = (r.usuario?.carrera?.nombre || 'Sin Carrera').replace(/"/g, '""');
      const modalidad = r.numeroComputadora ? 'Computadora Individual' : 'Laboratorio Completo';
      const numPc = r.numeroComputadora ? `PC-${r.numeroComputadora}` : 'N/A';
      const asistio = r.horaAsistencia ? 'SI' : 'NO';
      const horaCheckin = formatearHoraExacta(r.horaAsistencia) || 'N/A';
      const labNombre = (r.laboratorio?.nombre || '').replace(/"/g, '""');
      const labUbicacion = (r.laboratorio?.ubicacion || '').replace(/"/g, '""');
      const usuarioNombre = (r.usuario?.nombreCompleto || '').replace(/"/g, '""');
      const usuarioCorreo = (r.usuario?.correo || '').replace(/"/g, '""');

      return [
        r.id,
        fechaReserva,
        `"${horaIni}"`,
        `"${horaFin}"`,
        `"${carreraLab}"`,
        `"${labNombre}"`,
        `"${labUbicacion}"`,
        `"${usuarioNombre}"`,
        `"${usuarioCorreo}"`,
        `"${carreraUser}"`,
        `"${modalidad}"`,
        `"${numPc}"`,
        `"${r.estado}"`,
        `"${asistio}"`,
        `"${horaCheckin}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [encabezados.join(','), ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nombreArchivo = modoAuditoria === 'rango'
      ? `Dataset_PowerBI_Asistencias_${fechaInicio}_al_${fechaFin}.csv`
      : `Dataset_PowerBI_Asistencias_${fecha}.csv`;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Dataset exportado para Microsoft Power BI (CSV UTF-8)');
  };

  // Cálculo SVG Donut: Distribución por Carreras
  const segmentosPastelCarreras = useMemo(() => {
    const carrList = reporte?.resumen?.porCarrera || [];
    const total = reporte?.resumen?.totalReservas || 0;
    if (total === 0 || carrList.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return carrList.map((c, idx) => {
      const frac = c.total / total;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        id: c.id,
        nombre: c.nombre,
        total: c.total,
        porcentaje: c.porcentaje,
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [reporte]);

  // Cálculo SVG Donut: Distribución por Estados
  const segmentosPastelEstados = useMemo(() => {
    if (!reporte?.resumen?.porEstado) return [];
    const total = reporte.resumen.totalReservas;
    if (total === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return Object.entries(reporte.resumen.porEstado).map(([estado, cantidad]) => {
      const porcentaje = cantidad / total;
      const longitudGuion = porcentaje * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += porcentaje;

      const confColor = COLORES_ESTADOS[estado] || { hex: '#6366f1', bg: 'bg-indigo-500' };

      return {
        estado,
        cantidad,
        porcentaje: Math.round(porcentaje * 100),
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color: confColor.hex,
        bgColor: confColor.bg
      };
    });
  }, [reporte]);

  // Cálculo SVG Donut: Laboratorios Más Reservados
  const segmentosPastelLabs = useMemo(() => {
    const labs = reporte?.resumen?.porLaboratorio || [];
    const total = reporte?.resumen?.totalReservas || 0;
    if (total === 0 || labs.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return labs.map((l, idx) => {
      const frac = l.total / total;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        id: l.id,
        nombre: l.nombre,
        total: l.total,
        porcentaje: l.porcentaje,
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [reporte]);

  // Cálculo SVG Donut: Días con Mayor Demanda
  const segmentosPastelDias = useMemo(() => {
    const dias = reporte?.resumen?.porDia || [];
    const total = reporte?.resumen?.totalReservas || 0;
    if (total === 0 || dias.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return dias.map((d, idx) => {
      const frac = d.total / total;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        fecha: d.fecha,
        diaSemana: d.diaSemana,
        total: d.total,
        porcentaje: d.porcentaje,
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [reporte]);

  // Cálculo: Barras de Ocupación Horaria (Horarios Pico)
  const distribucionHoraria = useMemo(() => {
    const franjas = [
      { etiqueta: '06:45 - 08:15', inicioH: 6.75, finH: 8.25, cantidad: 0 },
      { etiqueta: '08:15 - 09:45', inicioH: 8.25, finH: 9.75, cantidad: 0 },
      { etiqueta: '09:45 - 11:15', inicioH: 9.75, finH: 11.25, cantidad: 0 },
      { etiqueta: '11:15 - 12:45', inicioH: 11.25, finH: 12.75, cantidad: 0 },
      { etiqueta: '12:45 - 14:15', inicioH: 12.75, finH: 14.25, cantidad: 0 },
      { etiqueta: '14:15 - 15:45', inicioH: 14.25, finH: 15.75, cantidad: 0 },
      { etiqueta: '15:45 - 17:15', inicioH: 15.75, finH: 17.25, cantidad: 0 },
      { etiqueta: '17:15 - 18:45', inicioH: 17.25, finH: 18.75, cantidad: 0 },
      { etiqueta: '18:45 - 20:15', inicioH: 18.75, finH: 20.25, cantidad: 0 },
      { etiqueta: '20:15 - 21:45', inicioH: 20.25, finH: 21.75, cantidad: 0 },
    ];

    if (!reporte?.reservas) return { franjas, maximo: 1 };

    let max = 0;
    for (const r of reporte.reservas) {
      try {
        const d = new Date(r.fechaInicio);
        const horaDecimal = d.getHours() + d.getMinutes() / 60;
        
        for (const f of franjas) {
          if (horaDecimal >= f.inicioH - 0.25 && horaDecimal < f.finH + 0.1) {
            f.cantidad += 1;
            if (f.cantidad > max) max = f.cantidad;
            break;
          }
        }
      } catch {}
    }

    return { franjas, maximo: max > 0 ? max : 1 };
  }, [reporte]);

  // Badge para estados de reserva
  const renderBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'Asistió':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Asistió
          </span>
        );
      case 'Aprobada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            Aprobada
          </span>
        );
      case 'Ausente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelada
          </span>
        );
      case 'Completada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            {estado}
          </span>
        );
    }
  };

  const total = reporte?.resumen?.totalReservas || 0;
  const asistencias = reporte?.resumen?.asistenciasRegistradas || 0;
  const ausencias = reporte?.resumen?.inasistenciasRegistradas || 0;
  const porcentajeAsistencia = total > 0 ? Math.round((asistencias / total) * 100) : 0;
  const carreraTop = reporte?.resumen?.carreraMasDemandada;
  const labTop = reporte?.resumen?.laboratorioMasReservado;
  const diaTop = reporte?.resumen?.diaMasReservado;

  const maxCarreraReservas = Math.max(...(reporte?.resumen?.porCarrera?.map(c => c.total) || [1]), 1);
  const maxLabReservas = Math.max(...(reporte?.resumen?.porLaboratorio?.map(l => l.total) || [1]), 1);
  const maxDiaReservas = Math.max(...(reporte?.resumen?.porDia?.map(d => d.total) || [1]), 1);

  const nombreCarreraFiltro = carreras.find(c => c.id === Number(carreraId))?.nombre;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cabecera y Navegación de Regreso */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link 
              to="/" 
              className="inline-flex items-center space-x-2 text-slate-500 hover:text-tech-blue dark:text-slate-400 dark:hover:text-blue-400 font-medium mb-3 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-tech-blue dark:text-blue-400 rounded-2xl shadow-sm">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-slate-900 dark:text-white">
                  Auditoría y Reportes de Asistencias
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Control de asistencia QR, comparativa por carreras académicas y trazabilidad temporal
                </p>
              </div>
            </div>
          </div>

          {/* Acciones de exportación, impresión y Power BI */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botón: Exportar a Power BI (CSV UTF-8) */}
            <button
              onClick={exportarDatasetPowerBI}
              type="button"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl font-medium transition-all shadow-sm text-xs sm:text-sm"
              title="Descarga el conjunto de datos preparado para modelar en Microsoft Power BI Desktop"
            >
              <Download className="w-4 h-4" />
              <span>Exportar a Power BI</span>
            </button>

            {/* Botón: Imprimir Reporte */}
            <button
              onClick={() => window.print()}
              type="button"
              className="inline-flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl font-medium transition-all shadow-sm text-xs sm:text-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Botón: Actualizar */}
            <button
              onClick={() => consultarReporte(true)}
              disabled={isRefreshing || isLoading}
              type="button"
              className="inline-flex items-center space-x-2 bg-tech-blue hover:bg-blue-600 disabled:opacity-60 text-white px-3.5 py-2 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros con Selector de Modo (Día Específico vs Rango de Fechas) */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 transition-colors">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700/80 gap-3">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
              <Filter className="w-4 h-4 text-tech-blue" />
              <span>Filtros y Parámetros de Auditoría</span>
            </div>

            {/* Selector de Modo Temporal */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModoAuditoria('dia')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  modoAuditoria === 'dia'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Día Específico</span>
              </button>
              <button
                type="button"
                onClick={() => setModoAuditoria('rango')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  modoAuditoria === 'rango'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Rango de Fechas</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Selección Temporal Dinámica */}
            {modoAuditoria === 'dia' ? (
              <div>
                <label htmlFor="fecha-reporte" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Fecha de Auditoría *
                </label>
                <div className="relative">
                  <input
                    id="fecha-reporte"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fecha-inicio" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Fecha Desde *
                  </label>
                  <div className="relative">
                    <input
                      id="fecha-inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="fecha-fin" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Fecha Hasta *
                  </label>
                  <div className="relative">
                    <input
                      id="fecha-fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Selector de Carrera Académica */}
            <div>
              <label htmlFor="carrera-reporte" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Carrera Académica
              </label>
              <div className="relative">
                <select
                  id="carrera-reporte"
                  value={carreraId}
                  onChange={(e) => setCarreraId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
                >
                  <option value="">Todas las Carreras</option>
                  {carreras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Selector de Laboratorio Específico */}
            <div>
              <label htmlFor="lab-reporte" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Laboratorio Específico
              </label>
              <div className="relative">
                <select
                  id="lab-reporte"
                  value={laboratorioId}
                  onChange={(e) => setLaboratorioId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
                >
                  <option value="">{carreraId ? 'Todos de esta Carrera' : 'Todos los Laboratorios'}</option>
                  {laboratorios.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.nombre}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Atajos de Rango Rápido */}
          {modoAuditoria === 'rango' && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400 mr-1">Atajos rápidos:</span>
              <button
                type="button"
                onClick={() => aplicarPreset('hoy')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset('ultimos7')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset('esteMes')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
              >
                Este Mes
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset('proximos30')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
              >
                Próximos 30 días
              </button>
            </div>
          )}
        </section>

        {/* Tarjetas de Estadísticas Principales (KPIs) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          
          {/* Total Reservas */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {modoAuditoria === 'dia' ? 'Reservas Día' : 'Reservas Período'}
              </p>
              <p className="text-2xl font-poppins font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? '--' : total}
              </p>
              <span className="text-[10px] text-slate-400">Programadas</span>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-tech-blue dark:text-blue-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          {/* Asistencias Confirmadas por QR */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Asistencias (QR)
              </p>
              <p className="text-2xl font-poppins font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {isLoading ? '--' : asistencias}
              </p>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                {porcentajeAsistencia}% asistencia
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Inasistencias */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div>
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Inasistencias
              </p>
              <p className="text-2xl font-poppins font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                {isLoading ? '--' : ausencias}
              </p>
              <span className="text-[10px] text-rose-500/80">Usuarios ausentes</span>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Carrera Más Activa */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div className="min-w-0 pr-1.5">
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center">
                <BookOpen className="w-3 h-3 mr-1" /> Carrera Top
              </p>
              <p className="text-xs font-poppins font-bold text-slate-900 dark:text-white mt-1 truncate" title={carreraTop?.nombre || 'Sin reservas'}>
                {isLoading ? '--' : carreraTop ? carreraTop.nombre : 'Sin reservas'}
              </p>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {carreraTop ? `${carreraTop.total} res. (${carreraTop.porcentaje}%)` : '0 registros'}
              </span>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          {/* Laboratorio Más Demandado */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div className="min-w-0 pr-1.5">
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center">
                <Award className="w-3 h-3 mr-1" /> Lab. Top
              </p>
              <p className="text-xs font-poppins font-bold text-slate-900 dark:text-white mt-1 truncate" title={labTop?.nombre || 'Sin reservas'}>
                {isLoading ? '--' : labTop ? labTop.nombre : 'Sin reservas'}
              </p>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                {labTop ? `${labTop.total} res. (${labTop.porcentaje}%)` : '0 registros'}
              </span>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* Día con Mayor Demanda */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div className="min-w-0 pr-1.5">
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Día Pico
              </p>
              <p className="text-xs font-poppins font-bold text-slate-900 dark:text-white mt-1 truncate">
                {isLoading ? '--' : diaTop ? `${diaTop.diaSemana} ${formatearFecha(diaTop.fecha)}` : 'Sin registros'}
              </p>
              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold">
                {diaTop ? `${diaTop.total} res. (${diaTop.porcentaje}%)` : '0 registros'}
              </span>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex-shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
          </div>

        </section>

        {/* Banner de Contexto de Carrera si está filtrado */}
        {carreraId && (
          <div className="mb-6 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800/50 rounded-lg text-tech-blue dark:text-blue-300">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-white">
                  Auditoría enfocada en: <strong>{nombreCarreraFiltro || 'Carrera seleccionada'}</strong>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Las métricas y los gráficos muestran exclusivamente los laboratorios y reservas de esta carrera.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCarreraId('')}
              className="text-tech-blue dark:text-blue-400 hover:underline font-semibold self-start sm:self-auto"
            >
              Restablecer a Todas las Carreras
            </button>
          </div>
        )}

        {/* SECCIÓN ANALÍTICA COMPLETA (CARRERAS, LABORATORIOS, DÍAS, ESTADOS Y HORARIOS) */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 transition-colors">
          
          <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/80 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-tech-blue" />
                <h2 className="font-poppins font-bold text-slate-900 dark:text-white text-lg">
                  Estadísticas de Ocupación
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Métricas por carrera, laboratorio, horarios y asistencias
              </p>
            </div>

            {/* Selector de Pestaña Analítica */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl text-xs font-semibold gap-1 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTabAnalitica('integral')}
                className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  tabAnalitica === 'integral'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('carreras')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  tabAnalitica === 'carreras'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Carreras</span>
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('labs')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  tabAnalitica === 'labs'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Laboratorios</span>
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('dias')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  tabAnalitica === 'dias'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Días</span>
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('estados')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  tabAnalitica === 'estados'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Asistencias</span>
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('horarios')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  tabAnalitica === 'horarios'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Horarios</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue"></div>
              <p className="text-xs text-slate-400">Generando analítica visual...</p>
            </div>
          ) : total === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No hay reservas registradas en el período o para los filtros seleccionados.
            </div>
          ) : (
            <div className="pt-6">
              
              {/* VISTA A: POR CARRERAS ACADÉMICAS (DEMANDA INSTITUCIONAL) */}
              {(tabAnalitica === 'carreras' || tabAnalitica === 'integral') && (
                <div className="mb-8 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-tech-blue" />
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          Demanda y Ocupación por Carreras Académicas
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Volumen de reservas y tasa de uso comparativo entre las carreras universitarias
                        </p>
                      </div>
                    </div>

                    {/* Selector Pastel vs Barras */}
                    <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setFormatoGraficoCarreras('pastel')}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                          formatoGraficoCarreras === 'pastel'
                            ? 'bg-tech-blue text-white font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <PieChart className="w-3.5 h-3.5" />
                        <span>Pastel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormatoGraficoCarreras('barras')}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                          formatoGraficoCarreras === 'barras'
                            ? 'bg-tech-blue text-white font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Barras</span>
                      </button>
                    </div>
                  </div>

                  {formatoGraficoCarreras === 'pastel' ? (
                    /* Gráfico Pastel / Dona de Carreras */
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
                      <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-slate-200 dark:stroke-slate-700"
                            strokeWidth="14"
                            fill="transparent"
                          />
                          {segmentosPastelCarreras.map((seg, idx) => (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={seg.color}
                              strokeWidth="14"
                              strokeDasharray={seg.strokeDasharray}
                              strokeDashoffset={seg.strokeDashoffset}
                              fill="transparent"
                              className="transition-all duration-500 ease-out hover:opacity-80"
                            />
                          ))}
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-poppins font-extrabold text-slate-900 dark:text-white leading-none">
                            {reporte?.resumen?.porCarrera?.length || 0}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Carreras
                          </span>
                        </div>
                      </div>

                      {/* Leyenda y ranking */}
                      <div className="w-full max-w-md space-y-2.5">
                        {segmentosPastelCarreras.map((seg, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              if (seg.id) {
                                setCarreraId(String(seg.id));
                                toast.success(`Filtrando auditoría por: ${seg.nombre}`);
                              }
                            }}
                            className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-tech-blue/50 cursor-pointer transition-colors"
                            title="Haz clic para filtrar la auditoría por esta carrera"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span 
                                className="w-3 h-3 rounded-md flex-shrink-0"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">#{idx + 1}</span>
                              <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                                {seg.nombre}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                              {seg.total} reservas ({seg.porcentaje}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Gráfico de Barras de Carreras */
                    <div className="space-y-3 py-2">
                      {reporte?.resumen?.porCarrera?.map((carr, idx) => {
                        const porcentajeAncho = Math.round((carr.total / maxCarreraReservas) * 100);
                        const color = PALETA_COLORES[idx % PALETA_COLORES.length];

                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              if (carr.id) {
                                setCarreraId(String(carr.id));
                                toast.success(`Filtrando auditoría por: ${carr.nombre}`);
                              }
                            }}
                            className="space-y-1 p-1 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            title="Haz clic para filtrar por esta carrera"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                                <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                                {carr.nombre}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {carr.total} reservas ({carr.porcentaje}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(porcentajeAncho, 4)}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA B: POR LABORATORIOS (MAS RESERVADOS) */}
              {(tabAnalitica === 'labs' || tabAnalitica === 'integral') && (
                <div className="mb-8 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-tech-blue" />
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          Laboratorios Más Reservados {carreraId ? `(Carrera: ${nombreCarreraFiltro})` : '(Cuota de Demanda)'}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Distribución de uso entre los laboratorios activos
                        </p>
                      </div>
                    </div>

                    {/* Selector Pastel vs Barras */}
                    <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setFormatoGraficoLabs('pastel')}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                          formatoGraficoLabs === 'pastel'
                            ? 'bg-tech-blue text-white font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <PieChart className="w-3.5 h-3.5" />
                        <span>Pastel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormatoGraficoLabs('barras')}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                          formatoGraficoLabs === 'barras'
                            ? 'bg-tech-blue text-white font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Barras</span>
                      </button>
                    </div>
                  </div>

                  {formatoGraficoLabs === 'pastel' ? (
                    /* Gráfico Pastel / Dona de Laboratorios */
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
                      <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-slate-200 dark:stroke-slate-700"
                            strokeWidth="14"
                            fill="transparent"
                          />
                          {segmentosPastelLabs.map((seg) => (
                            <circle
                              key={seg.id}
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={seg.color}
                              strokeWidth="14"
                              strokeDasharray={seg.strokeDasharray}
                              strokeDashoffset={seg.strokeDashoffset}
                              fill="transparent"
                              className="transition-all duration-500 ease-out hover:opacity-80"
                            />
                          ))}
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-poppins font-extrabold text-slate-900 dark:text-white leading-none">
                            {total}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Reservas
                          </span>
                        </div>
                      </div>

                      {/* Leyenda y ranking */}
                      <div className="w-full max-w-md space-y-2.5">
                        {segmentosPastelLabs.map((seg, idx) => (
                          <div key={seg.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center space-x-2 truncate">
                              <span 
                                className="w-3 h-3 rounded-md flex-shrink-0"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">#{idx + 1}</span>
                              <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                                {seg.nombre}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                              {seg.total} reservas ({seg.porcentaje}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Gráfico de Barras Horizontales de Laboratorios */
                    <div className="space-y-3 py-2">
                      {reporte?.resumen?.porLaboratorio?.map((lab, idx) => {
                        const porcentajeAncho = Math.round((lab.total / maxLabReservas) * 100);
                        const color = PALETA_COLORES[idx % PALETA_COLORES.length];

                        return (
                          <div key={lab.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                                <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                                {lab.nombre}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {lab.total} reservas ({lab.porcentaje}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(porcentajeAncho, 4)}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA C: POR DÍAS (MAYOR AFLUENCIA Y PICOS EN EL TIEMPO) */}
              {(tabAnalitica === 'dias' || tabAnalitica === 'integral') && (
                <div className="mb-8 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <CalendarRange className="w-4 h-4 text-tech-blue" />
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          Demanda por Días (Afluencia Temporal)
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Evolución cronológica de las actividades de laboratorio
                        </p>
                      </div>
                    </div>

                    {/* Selector Barras vs Pastel */}
                    <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setFormatoGraficoDias('barras')}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                          formatoGraficoDias === 'barras'
                            ? 'bg-tech-blue text-white font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Barras</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormatoGraficoDias('pastel')}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                          formatoGraficoDias === 'pastel'
                            ? 'bg-tech-blue text-white font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <PieChart className="w-3.5 h-3.5" />
                        <span>Pastel</span>
                      </button>
                    </div>
                  </div>

                  {formatoGraficoDias === 'barras' ? (
                    /* Gráfico de Barras Verticales por Día */
                    <div className="pt-4">
                      <div className="h-44 flex items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                        {reporte?.resumen?.porDia?.map((d, i) => {
                          const alturaPct = Math.round((d.total / maxDiaReservas) * 100);
                          const esPico = diaTop?.fecha === d.fecha;

                          return (
                            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[20px]">
                              
                              {/* Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                                {d.diaSemana} {d.fecha}: <strong>{d.total} reservas ({d.porcentaje}%)</strong>
                              </div>

                              {/* Valor */}
                              <span className={`text-[10px] font-bold mb-1 ${esPico ? 'text-purple-600 dark:text-purple-400' : 'text-tech-blue'}`}>
                                {d.total}
                              </span>

                              {/* Barra */}
                              <div 
                                className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                                  esPico
                                    ? 'bg-gradient-to-t from-purple-600 to-indigo-400 shadow-sm'
                                    : 'bg-gradient-to-t from-tech-blue to-blue-400 group-hover:brightness-110 shadow-sm'
                                }`}
                                style={{ height: `${Math.max(alturaPct, 12)}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Eje X Fechas */}
                      <div className="flex justify-between gap-1 pt-2">
                        {reporte?.resumen?.porDia?.map((d, i) => (
                          <div key={i} className="flex-1 text-center min-w-[20px]">
                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate" title={`${d.diaSemana} ${d.fecha}`}>
                              {d.fecha.slice(5)} {d.diaSemana.slice(0, 3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Gráfico Pastel de Días */
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
                      <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-slate-200 dark:stroke-slate-700"
                            strokeWidth="14"
                            fill="transparent"
                          />
                          {segmentosPastelDias.map((seg, idx) => (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={seg.color}
                              strokeWidth="14"
                              strokeDasharray={seg.strokeDasharray}
                              strokeDashoffset={seg.strokeDashoffset}
                              fill="transparent"
                              className="transition-all duration-500 ease-out hover:opacity-80"
                            />
                          ))}
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-poppins font-extrabold text-slate-900 dark:text-white leading-none">
                            {reporte?.resumen?.porDia?.length || 0}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Días con Uso
                          </span>
                        </div>
                      </div>

                      <div className="w-full max-w-md space-y-2">
                        {segmentosPastelDias.map((seg, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center space-x-2 truncate">
                              <span 
                                className="w-3 h-3 rounded-md flex-shrink-0"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="text-slate-800 dark:text-slate-200 font-medium">
                                {seg.diaSemana} ({seg.fecha})
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                              {seg.total} reservas ({seg.porcentaje}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VISTA D: ASISTENCIA Y ESTADOS (PASTEL) & HORARIOS PICO (BARRAS) */}
              {(tabAnalitica === 'estados' || tabAnalitica === 'horarios' || tabAnalitica === 'integral') && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Gráfico de Pastel de Estados */}
                  {(tabAnalitica === 'estados' || tabAnalitica === 'integral') && (
                    <div className={`${tabAnalitica === 'estados' ? 'lg:col-span-12 max-w-2xl mx-auto w-full' : 'lg:col-span-5'} bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60`}>
                      <div className="flex items-center space-x-2 mb-4">
                        <PieChart className="w-4 h-4 text-tech-blue" />
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            Distribución Porcentual por Estado
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Asistencia, inasistencias y aprobaciones
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-slate-200 dark:stroke-slate-700"
                              strokeWidth="14"
                              fill="transparent"
                            />
                            {segmentosPastelEstados.map((seg, idx) => (
                              <circle
                                key={idx}
                                cx="50"
                                cy="50"
                                r="40"
                                stroke={seg.color}
                                strokeWidth="14"
                                strokeDasharray={seg.strokeDasharray}
                                strokeDashoffset={seg.strokeDashoffset}
                                fill="transparent"
                                className="transition-all duration-500 ease-out hover:opacity-80"
                              />
                            ))}
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-poppins font-extrabold text-slate-900 dark:text-white leading-none">
                              {porcentajeAsistencia}%
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              Asistencia
                            </span>
                          </div>
                        </div>

                        <div className="w-full space-y-2">
                          {segmentosPastelEstados.map((seg) => (
                            <div key={seg.estado} className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2 truncate">
                                <span 
                                  className="w-3 h-3 rounded-md flex-shrink-0"
                                  style={{ backgroundColor: seg.color }}
                                />
                                <span className="text-slate-700 dark:text-slate-300 truncate">
                                  {seg.estado}
                                </span>
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                                {seg.cantidad} ({seg.porcentaje}%)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gráfico de Barras de Horarios Pico */}
                  {(tabAnalitica === 'horarios' || tabAnalitica === 'integral') && (
                    <div className={`${tabAnalitica === 'horarios' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-tech-blue" />
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              Ocupación por Franjas Horarias (Horarios Pico)
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Concentración horaria para dimensionamiento de turnos
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Pico máx: {distribucionHoraria.maximo} reservas
                        </span>
                      </div>

                      <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-200 dark:border-slate-700">
                        {distribucionHoraria.franjas.map((f, i) => {
                          const alturaPct = Math.round((f.cantidad / distribucionHoraria.maximo) * 100);
                          const tieneReservas = f.cantidad > 0;

                          return (
                            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                                {f.etiqueta}: <strong>{f.cantidad} reservas</strong>
                              </div>

                              {tieneReservas && (
                                <span className="text-[10px] font-bold text-tech-blue mb-1">
                                  {f.cantidad}
                                </span>
                              )}

                              <div 
                                className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                                  tieneReservas 
                                    ? 'bg-gradient-to-t from-tech-blue to-blue-400 group-hover:brightness-110 shadow-sm' 
                                    : 'bg-slate-200/70 dark:bg-slate-700/50'
                                }`}
                                style={{ height: tieneReservas ? `${Math.max(alturaPct, 12)}%` : '6px' }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between gap-1 pt-2">
                        {distribucionHoraria.franjas.map((f, i) => (
                          <div key={i} className="flex-1 text-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate" title={f.etiqueta}>
                              {f.etiqueta.split(' - ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </section>

        {/* Tabla Detallada de Reservas y Trazabilidad */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-poppins font-bold text-slate-900 dark:text-white text-lg">
                Detalle de Asistencias y Auditoría de Reservas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {modoAuditoria === 'rango' 
                  ? `Trazabilidad entre ${formatearFecha(fechaInicio)} y ${formatearFecha(fechaFin)}`
                  : `Trazabilidad para el día ${formatearFecha(fecha)}`}
                {carreraId ? ` • Filtrado por carrera: ${nombreCarreraFiltro}` : ''}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total listado: <strong>{reporte?.reservas?.length || 0}</strong>
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-blue"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generando reporte de auditoría...</p>
            </div>
          ) : !reporte?.reservas || reporte.reservas.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                No se encontraron reservas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No hay actividades registradas para los filtros seleccionados
                {laboratorioId ? ' en este laboratorio' : ''}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Fecha y Horario</th>
                    <th scope="col" className="px-5 py-3.5">Carrera / Laboratorio</th>
                    <th scope="col" className="px-5 py-3.5">Usuario Titular</th>
                    <th scope="col" className="px-5 py-3.5">Modalidad</th>
                    <th scope="col" className="px-5 py-3.5">Estado</th>
                    <th scope="col" className="px-5 py-3.5">Ingreso / Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {reporte.reservas.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                      
                      {/* Fecha y Horario */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-white text-xs mb-0.5">
                          {formatearFecha(r.fechaInicio)}
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatearHora(r.fechaInicio)} - {formatearHora(r.fechaFin)}</span>
                        </div>
                      </td>

                      {/* Carrera / Laboratorio */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {r.laboratorio?.nombre || 'Laboratorio N/A'}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {r.laboratorio?.carrera?.nombre || 'General / Sin Asignar'}
                          </span>
                          {r.laboratorio?.ubicacion && (
                            <span className="flex items-center text-slate-400 text-[11px]">
                              <MapPin className="w-3 h-3 mr-0.5" />
                              {r.laboratorio.ubicacion}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usuario */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {r.usuario?.nombreCompleto || 'Usuario'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {r.usuario?.correo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Modalidad */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.numeroComputadora ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-tech-blue dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Monitor className="w-3.5 h-3.5 mr-1" />
                            PC #{r.numeroComputadora}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 mr-1" />
                            Lab. Completo
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderBadgeEstado(r.estado)}
                      </td>

                      {/* Sello de Asistencia */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.horaAsistencia ? (
                          <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Confirmada a las {formatearHoraExacta(r.horaAsistencia)}</span>
                          </div>
                        ) : r.estado === 'Ausente' ? (
                          <div className="text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center space-x-1">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span>Inasistencia registrada</span>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendiente de escaneo QR</span>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
