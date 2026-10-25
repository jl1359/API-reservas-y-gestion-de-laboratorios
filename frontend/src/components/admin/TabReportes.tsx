import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  Clock, 
  Users, 
  CheckCircle2, 
  Building2,
  Calendar,
  GraduationCap,
  Eye,
  X,
  XCircle,
  Table,
  Layers,
  RotateCcw,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportesApi } from '../../api/reportes.api';
import type { ResumenMetricasAcademicas, MetricasLaboratorio } from '../../types';

interface LaboratorioOption {
  id: number;
  nombre: string;
}

interface TabReportesProps {
  laboratorios: LaboratorioOption[];
}

const PALETA_COLORES = [
  '#2563eb', // azul
  '#7c3aed', // violeta
  '#db2777', // rosa
  '#ea580c', // naranja
  '#059669', // esmeralda
  '#0891b2', // cian
  '#d97706', // ámbar
  '#4f46e5', // índigo
  '#0d9488', // turquesa
  '#64748b'  // pizarra
];

export default function TabReportes({ laboratorios }: TabReportesProps) {
  const [metricasData, setMetricasData] = useState<ResumenMetricasAcademicas | null>(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroLabId, setFiltroLabId] = useState('');
  const [isLoadingMetricas, setIsLoadingMetricas] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const [modoVista, setModoVista] = useState<'graficos' | 'tabla'>('graficos');
  const [tabGrafico, setTabGrafico] = useState<'horas' | 'reservas' | 'estudiantes' | 'asistencia'>('horas');
  
  const [formatoHoras, setFormatoHoras] = useState<'pastel' | 'barras'>('pastel');
  const [formatoReservas, setFormatoReservas] = useState<'pastel' | 'barras'>('pastel');
  const [formatoEstudiantes, setFormatoEstudiantes] = useState<'barras' | 'pastel'>('barras');

  const [labDetalleModal, setLabDetalleModal] = useState<MetricasLaboratorio | null>(null);

  const handleCargarMetricas = async () => {
    if (filtroFechaInicio && filtroFechaFin && filtroFechaInicio > filtroFechaFin) {
      toast.error('La fecha de inicio no puede ser posterior a la fecha fin');
      return;
    }
    if (filtroFechaFin && filtroFechaFin.slice(0, 4) > '2035') {
      toast.error('El año de la fecha hasta excede el límite permitido');
      return;
    }

    setIsLoadingMetricas(true);
    try {
      const data = await reportesApi.obtenerMetricas(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      setMetricasData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al calcular métricas');
    } finally {
      setIsLoadingMetricas(false);
    }
  };

  useEffect(() => {
    handleCargarMetricas();
  }, []);

  const aplicarPreset = (tipo: 'hoy' | 'ultimos30' | 'esteMes' | 'limpiar') => {
    const ahora = new Date();
    const formato = (d: Date) => d.toISOString().slice(0, 10);
    
    if (tipo === 'hoy') {
      const hoy = formato(ahora);
      setFiltroFechaInicio(hoy);
      setFiltroFechaFin(hoy);
    } else if (tipo === 'ultimos30') {
      const pasada = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFiltroFechaInicio(formato(pasada));
      setFiltroFechaFin(formato(ahora));
    } else if (tipo === 'esteMes') {
      const primero = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const ultimo = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
      setFiltroFechaInicio(formato(primero));
      setFiltroFechaFin(formato(ultimo));
    } else if (tipo === 'limpiar') {
      setFiltroFechaInicio('');
      setFiltroFechaFin('');
    }
  };

  const handleDescargarCsvMetricas = async () => {
    setIsDownloadingCsv(true);
    try {
      await reportesApi.descargarCsv(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      toast.success('Archivo CSV descargado correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al descargar informe CSV');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleDescargarExcelMetricas = async () => {
    setIsDownloadingCsv(true);
    try {
      await reportesApi.descargarExcel(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      toast.success('Archivo Excel descargado correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al descargar informe Excel');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  // Cálculo de segmentos para el Pastel de Horas
  const segmentosPastelHoras = useMemo(() => {
    const labs = metricasData?.laboratorios || [];
    const totalHoras = metricasData?.totalHorasCampus || 0;
    if (totalHoras === 0 || labs.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return labs.map((l, idx) => {
      const frac = l.horasUsoEfectivo / totalHoras;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        lab: l,
        id: l.laboratorioId,
        nombre: l.nombre,
        valor: l.horasUsoEfectivo,
        porcentaje: Math.round(frac * 100),
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [metricasData]);

  // Cálculo de segmentos para el Pastel de Reservas
  const segmentosPastelReservas = useMemo(() => {
    const labs = metricasData?.laboratorios || [];
    const totalReservas = metricasData?.totalReservasCampus || 0;
    if (totalReservas === 0 || labs.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return labs.map((l, idx) => {
      const frac = l.totalReservas / totalReservas;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        lab: l,
        id: l.laboratorioId,
        nombre: l.nombre,
        valor: l.totalReservas,
        porcentaje: Math.round(frac * 100),
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [metricasData]);

  // Cálculo de segmentos para el Pastel de Estudiantes
  const segmentosPastelEstudiantes = useMemo(() => {
    const labs = metricasData?.laboratorios || [];
    const totalEstudiantes = metricasData?.totalAlumnosBeneficiados || 0;
    if (totalEstudiantes === 0 || labs.length === 0) return [];

    let acumulado = 0;
    const radio = 40;
    const circunferencia = 2 * Math.PI * radio;

    return labs.map((l, idx) => {
      const frac = l.alumnosBeneficiados / totalEstudiantes;
      const longitudGuion = frac * circunferencia;
      const desfase = (1 - acumulado) * circunferencia;
      acumulado += frac;
      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

      return {
        lab: l,
        id: l.laboratorioId,
        nombre: l.nombre,
        valor: l.alumnosBeneficiados,
        porcentaje: Math.round(frac * 100),
        strokeDasharray: `${longitudGuion} ${circunferencia - longitudGuion}`,
        strokeDashoffset: desfase,
        color
      };
    });
  }, [metricasData]);

  const maxHoras = Math.max(...(metricasData?.laboratorios?.map(l => l.horasUsoEfectivo) || [1]), 1);
  const maxReservas = Math.max(...(metricasData?.laboratorios?.map(l => l.totalReservas) || [1]), 1);
  const maxEstudiantes = Math.max(...(metricasData?.laboratorios?.map(l => l.alumnosBeneficiados) || [1]), 1);

  return (
    <div className="space-y-6">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-tech-blue" />
            Métricas de Ocupación e Informes Académicos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidado institucional de horas lectivas, tasas de aprovechamiento y acreditación universitaria.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            to="/reportes/asistencias"
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center shadow-xs active:scale-[0.98] whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-1.5 text-tech-blue" />
            Auditoría Diaria
          </Link>
          <button
            onClick={handleDescargarCsvMetricas}
            disabled={isDownloadingCsv || isLoadingMetricas}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center shadow-sm shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            title="Descargar archivo CSV compatible con Excel con todas las métricas de ocupación"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloadingCsv ? 'Generando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={handleDescargarExcelMetricas}
            disabled={isDownloadingCsv || isLoadingMetricas}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center shadow-sm shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            title="Descargar archivo Excel con formato de acreditación académica"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloadingCsv ? 'Generando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* Barra de Filtros con Atajos */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-1 lg:col-span-3">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fecha Desde</label>
            <input
              type="date"
              min="2020-01-01"
              max="2035-12-31"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white"
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fecha Hasta</label>
            <input
              type="date"
              min="2020-01-01"
              max="2035-12-31"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white"
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-4">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Filtrar por Laboratorio</label>
            <select
              value={filtroLabId}
              onChange={(e) => setFiltroLabId(e.target.value)}
              className="w-full h-[42px] px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos los laboratorios</option>
              {laboratorios.map((l) => (
                <option key={l.id} value={l.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <button
              onClick={handleCargarMetricas}
              disabled={isLoadingMetricas}
              className="w-full h-[42px] px-4 bg-tech-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 active:scale-[0.985] disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span>{isLoadingMetricas ? 'Calculando...' : 'Aplicar'}</span>
            </button>
          </div>
        </div>

        {/* Atajos Rápidos y Restablecer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center text-[11px]">
              <Calendar className="w-3.5 h-3.5 mr-1 text-tech-blue" /> Atajos rápidos:
            </span>
            <button
              type="button"
              onClick={() => aplicarPreset('hoy')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors text-[11px]"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => aplicarPreset('ultimos30')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors text-[11px]"
            >
              Últimos 30 días
            </button>
            <button
              type="button"
              onClick={() => aplicarPreset('esteMes')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors text-[11px]"
            >
              Este Mes
            </button>
          </div>

          <button
            type="button"
            onClick={() => aplicarPreset('limpiar')}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-2.5 py-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/40 rounded-lg transition-colors text-[11px] font-medium"
            title="Limpiar rango de fechas y filtros"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer Filtros</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Ejecutivas */}
      {metricasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Horas de Práctica Efectiva</p>
              <p className="text-2xl font-bold font-heading text-tech-blue mt-1">
                {metricasData.totalHorasCampus} hrs
              </p>
              <p className="text-[11px] text-slate-400 mt-1">En el período seleccionado</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-tech-blue rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Tasa de Asistencia Global</p>
              <p className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1">
                {metricasData.tasaAsistenciaPromedio}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Aprovechamiento de aforo</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Estudiantes Beneficiados</p>
              <p className="text-2xl font-bold font-heading text-indigo-600 dark:text-indigo-400 mt-1">
                {metricasData.totalAlumnosBeneficiados}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Alumnos que cursaron prácticas</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-slate-500 uppercase font-semibold">Laboratorio Top Demanda</p>
              <p className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1 truncate" title={metricasData.laboratorioMasDemandado}>
                {metricasData.laboratorioMasDemandado}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Mayor frecuencia de uso</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* SELECTOR DE VISTA LIMPIO: GRÁFICOS ANALÍTICOS vs TABLA INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Layers className="w-4 h-4 text-tech-blue" />
          <span>Modo de Visualización:</span>
        </div>

        <div className="flex items-center bg-slate-100/90 dark:bg-slate-950/60 p-1 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => setModoVista('graficos')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg transition-all active:scale-[0.98] ${
              modoVista === 'graficos'
                ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard Gráfico</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVista('tabla')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg transition-all active:scale-[0.98] ${
              modoVista === 'tabla'
                ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabla de Métricas</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: DASHBOARD GRÁFICO (FOCALIZADO Y LIMPIO) */}
      {modoVista === 'graficos' && metricasData && metricasData.laboratorios.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/80 transition-colors">
          
          {/* Navegación por Métricas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800 gap-3">
            <div>
              <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-tech-blue" />
                Analítica Focalizada por Métrica
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Haz clic en cualquier laboratorio para inspeccionar su reporte detallado
              </p>
            </div>

            {/* Selector de Métrica */}
            <div className="flex flex-wrap items-center bg-slate-100/90 dark:bg-slate-950/60 p-1.5 rounded-2xl text-xs font-semibold gap-1 border border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setTabGrafico('horas')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] ${
                  tabGrafico === 'horas'
                    ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Horas de Uso</span>
              </button>

              <button
                type="button"
                onClick={() => setTabGrafico('reservas')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] ${
                  tabGrafico === 'reservas'
                    ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Total Reservas</span>
              </button>

              <button
                type="button"
                onClick={() => setTabGrafico('estudiantes')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] ${
                  tabGrafico === 'estudiantes'
                    ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Estudiantes</span>
              </button>

              <button
                type="button"
                onClick={() => setTabGrafico('asistencia')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] ${
                  tabGrafico === 'asistencia'
                    ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprovechamiento (%)</span>
              </button>
            </div>
          </div>

          <div className="pt-6">
            
            {/* GRÁFICO A: HORAS DE USO */}
            {tabGrafico === 'horas' && (
              <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Distribución de Horas de Práctica Efectiva
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total campus: {metricasData.totalHorasCampus} hrs
                    </p>
                  </div>

                  <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFormatoHoras('barras')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                        formatoHoras === 'barras'
                          ? 'bg-tech-blue text-white font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Barras</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormatoHoras('pastel')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                        formatoHoras === 'pastel'
                          ? 'bg-tech-blue text-white font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Circular</span>
                    </button>
                  </div>
                </div>

                {formatoHoras === 'pastel' ? (
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
                        {segmentosPastelHoras.map((seg) => (
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
                          {metricasData.totalHorasCampus}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Horas Totales
                        </span>
                      </div>
                    </div>

                    <div className="w-full max-w-md space-y-2">
                      {segmentosPastelHoras.map((seg, idx) => (
                        <div 
                          key={seg.id} 
                          onClick={() => setLabDetalleModal(seg.lab)}
                          className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-tech-blue/50 cursor-pointer transition-colors"
                          title="Haz clic para ver el reporte detallado de este laboratorio"
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
                          <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0 flex items-center space-x-1.5">
                            <span>{seg.valor} hrs ({seg.porcentaje}%)</span>
                            <Eye className="w-3.5 h-3.5 text-tech-blue" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {metricasData.laboratorios.map((lab, idx) => {
                      const porcentajeAncho = Math.round((lab.horasUsoEfectivo / maxHoras) * 100);
                      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

                      return (
                        <div 
                          key={lab.laboratorioId} 
                          onClick={() => setLabDetalleModal(lab)}
                          className="space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Haz clic para ver el reporte detallado"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                              <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                              {lab.nombre}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                              <span>{lab.horasUsoEfectivo} hrs</span>
                              <Eye className="w-3.5 h-3.5 text-tech-blue" />
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

            {/* GRÁFICO B: TOTAL DE RESERVAS */}
            {tabGrafico === 'reservas' && (
              <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Frecuencia de Uso y Reservas Solicitadas
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total acumulado: {metricasData.totalReservasCampus} reservas
                    </p>
                  </div>

                  <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFormatoReservas('barras')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                        formatoReservas === 'barras'
                          ? 'bg-tech-blue text-white font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Barras</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormatoReservas('pastel')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                        formatoReservas === 'pastel'
                          ? 'bg-tech-blue text-white font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Circular</span>
                    </button>
                  </div>
                </div>

                {formatoReservas === 'pastel' ? (
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
                        {segmentosPastelReservas.map((seg) => (
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
                          {metricasData.totalReservasCampus}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Reservas
                        </span>
                      </div>
                    </div>

                    <div className="w-full max-w-md space-y-2">
                      {segmentosPastelReservas.map((seg, idx) => (
                        <div 
                          key={seg.id} 
                          onClick={() => setLabDetalleModal(seg.lab)}
                          className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-tech-blue/50 cursor-pointer transition-colors"
                          title="Haz clic para ver el reporte detallado"
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
                          <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0 flex items-center space-x-1.5">
                            <span>{seg.valor} reservas ({seg.porcentaje}%)</span>
                            <Eye className="w-3.5 h-3.5 text-tech-blue" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {metricasData.laboratorios.map((lab, idx) => {
                      const porcentajeAncho = Math.round((lab.totalReservas / maxReservas) * 100);
                      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

                      return (
                        <div 
                          key={lab.laboratorioId} 
                          onClick={() => setLabDetalleModal(lab)}
                          className="space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Haz clic para ver el reporte detallado"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                              <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                              {lab.nombre}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                              <span>{lab.totalReservas} reservas</span>
                              <Eye className="w-3.5 h-3.5 text-tech-blue" />
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

            {/* GRÁFICO C: ESTUDIANTES */}
            {tabGrafico === 'estudiantes' && (
              <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Estudiantes Beneficiados por Laboratorio
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total campus: {metricasData.totalAlumnosBeneficiados} estudiantes
                    </p>
                  </div>

                  <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFormatoEstudiantes('barras')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                        formatoEstudiantes === 'barras'
                          ? 'bg-tech-blue text-white font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Barras</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormatoEstudiantes('pastel')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
                        formatoEstudiantes === 'pastel'
                          ? 'bg-tech-blue text-white font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Circular</span>
                    </button>
                  </div>
                </div>

                {formatoEstudiantes === 'barras' ? (
                  <div className="space-y-3 py-2">
                    {metricasData.laboratorios.map((lab, idx) => {
                      const porcentajeAncho = Math.round((lab.alumnosBeneficiados / maxEstudiantes) * 100);
                      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

                      return (
                        <div 
                          key={lab.laboratorioId} 
                          onClick={() => setLabDetalleModal(lab)}
                          className="space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Haz clic para ver el reporte detallado"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                              <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                              {lab.nombre}
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
                              <span>{lab.alumnosBeneficiados} alumnos</span>
                              <Eye className="w-3.5 h-3.5 text-tech-blue" />
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
                ) : (
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
                        {segmentosPastelEstudiantes.map((seg) => (
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
                          {metricasData.totalAlumnosBeneficiados}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Estudiantes
                        </span>
                      </div>
                    </div>

                    <div className="w-full max-w-md space-y-2">
                      {segmentosPastelEstudiantes.map((seg, idx) => (
                        <div 
                          key={seg.id} 
                          onClick={() => setLabDetalleModal(seg.lab)}
                          className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-tech-blue/50 cursor-pointer transition-colors"
                          title="Haz clic para ver el reporte detallado"
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
                          <div className="font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0 flex items-center space-x-1.5">
                            <span>{seg.valor} alumnos ({seg.porcentaje}%)</span>
                            <Eye className="w-3.5 h-3.5 text-tech-blue" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GRÁFICO D: APROVECHAMIENTO Y TASA DE ASISTENCIA */}
            {tabGrafico === 'asistencia' && (
              <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Tasa de Asistencia Efectiva por Laboratorio
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Aprovechamiento de cupos confirmados mediante control QR
                    </p>
                  </div>
                </div>

                <div className="space-y-3 py-2">
                  {metricasData.laboratorios.map((lab) => {
                    const colorBarra = lab.tasaAsistencia >= 80 
                      ? 'bg-emerald-500' 
                      : lab.tasaAsistencia >= 50 
                      ? 'bg-amber-500' 
                      : 'bg-rose-500';

                    return (
                      <div 
                        key={lab.laboratorioId} 
                        onClick={() => setLabDetalleModal(lab)}
                        className="space-y-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Haz clic para ver el reporte detallado"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {lab.nombre}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <span>{lab.tasaAsistencia}% ({lab.reservasAsistidas} asistidas / {lab.reservasAusentes} ausentes)</span>
                            <Eye className="w-3.5 h-3.5 text-tech-blue" />
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
                            style={{ width: `${Math.max(lab.tasaAsistencia, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SECCIÓN 2: TABLA INSTITUCIONAL COMPACTA */}
      {modoVista === 'tabla' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <h4 className="font-poppins font-bold text-slate-900 dark:text-white text-sm">
              Consolidado Institucional por Espacio Académico
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Laboratorios evaluados: <strong>{metricasData?.laboratorios?.length || 0}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700 text-xs">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Laboratorio</th>
                  <th className="px-4 py-3.5 font-bold">Capacidad</th>
                  <th className="px-4 py-3.5 font-bold">Total Reservas</th>
                  <th className="px-4 py-3.5 font-bold">Horas Uso</th>
                  <th className="px-4 py-3.5 font-bold">Asistencia</th>
                  <th className="px-4 py-3.5 font-bold">Estudiantes</th>
                  <th className="px-5 py-3.5 font-bold text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {isLoadingMetricas ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                    </td>
                  </tr>
                ) : !metricasData || metricasData.laboratorios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No hay registros de uso en el rango seleccionado
                    </td>
                  </tr>
                ) : (
                  metricasData.laboratorios.map((lab) => (
                    <tr
                      key={lab.laboratorioId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{lab.nombre}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            <GraduationCap className="w-2.5 h-2.5 mr-1 text-slate-400" />
                            {lab.carreraNombre || 'General / Central'}
                          </span>
                          {lab.ubicacion && (
                            <span className="text-[11px] text-slate-400">{lab.ubicacion}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{lab.capacidad} Asientos</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{lab.totalReservas}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-tech-blue">{lab.horasUsoEfectivo} hrs</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            lab.tasaAsistencia >= 80
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : lab.tasaAsistencia >= 50
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}
                        >
                          {lab.tasaAsistencia}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{lab.alumnosBeneficiados}</td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setLabDetalleModal(lab)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-tech-blue hover:text-white bg-blue-50 dark:bg-blue-900/30 hover:bg-tech-blue dark:hover:bg-tech-blue rounded-lg border border-blue-200 dark:border-blue-800 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Ficha</span>
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

      {/* MODAL: REPORTE DETALLADO POR LABORATORIO (PROGRESSIVE DISCLOSURE) */}
      {labDetalleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Cabecera del Modal */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/80 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-tech-blue dark:text-blue-400 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
                    {labDetalleModal.nombre}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {labDetalleModal.carreraNombre || 'General / Central'}
                    </span>
                    <span>•</span>
                    <span>{labDetalleModal.ubicacion || 'Campus Central'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLabDetalleModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Reporte Detallado */}
            <div className="p-6 space-y-6">
              
              {/* Cuadrícula de Métricas Principales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Práctica Efectiva</p>
                  <p className="text-lg font-bold font-poppins text-tech-blue mt-1">
                    {labDetalleModal.horasUsoEfectivo} hrs
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Reservas</p>
                  <p className="text-lg font-bold font-poppins text-slate-900 dark:text-white mt-1">
                    {labDetalleModal.totalReservas}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Estudiantes</p>
                  <p className="text-lg font-bold font-poppins text-indigo-600 dark:text-indigo-400 mt-1">
                    {labDetalleModal.alumnosBeneficiados}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Capacidad</p>
                  <p className="text-lg font-bold font-poppins text-slate-900 dark:text-white mt-1">
                    {labDetalleModal.capacidad} Asientos
                  </p>
                </div>
              </div>

              {/* Aprovechamiento de Aforo y Tasa de Asistencia */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Tasa de Asistencia Efectiva:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    labDetalleModal.tasaAsistencia >= 80
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : labDetalleModal.tasaAsistencia >= 50
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}>
                    {labDetalleModal.tasaAsistencia}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      labDetalleModal.tasaAsistencia >= 80 ? 'bg-emerald-500' : labDetalleModal.tasaAsistencia >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(labDetalleModal.tasaAsistencia, 3)}%` }}
                  />
                </div>
              </div>

              {/* Desglose de Estado de Reservas */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Desglose de Reservas en este Laboratorio
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold block text-base">
                      {labDetalleModal.reservasAsistidas}
                    </span>
                    <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 flex items-center mt-0.5">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Asistidas (QR)
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40">
                    <span className="text-rose-700 dark:text-rose-400 font-bold block text-base">
                      {labDetalleModal.reservasAusentes}
                    </span>
                    <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 flex items-center mt-0.5">
                      <XCircle className="w-3 h-3 mr-1" /> Inasistencias
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <span className="text-blue-700 dark:text-blue-400 font-bold block text-base">
                      {labDetalleModal.reservasAprobadas}
                    </span>
                    <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 flex items-center mt-0.5">
                      <Clock className="w-3 h-3 mr-1" /> Aprobadas
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600">
                    <span className="text-slate-700 dark:text-slate-300 font-bold block text-base">
                      {labDetalleModal.reservasCanceladas}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                      <X className="w-3 h-3 mr-1" /> Canceladas
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Pie del Modal */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <Link
                to={`/reportes/asistencias?laboratorioId=${labDetalleModal.laboratorioId}`}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-tech-blue hover:underline"
              >
                <FileText className="w-4 h-4" />
                <span>Auditar asistencias individuales de este laboratorio</span>
              </Link>

              <button
                type="button"
                onClick={() => setLabDetalleModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
