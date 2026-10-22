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
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportesApi } from '../../api/reportes.api';
import type { ResumenMetricasAcademicas } from '../../types';

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

  // Pestaña visual del Dashboard
  const [tabVisual, setTabVisual] = useState<'integral' | 'horas' | 'reservas' | 'estudiantes' | 'asistencia'>('integral');
  // Conmutadores de formato Pastel vs Barras
  const [formatoHoras, setFormatoHoras] = useState<'pastel' | 'barras'>('pastel');
  const [formatoReservas, setFormatoReservas] = useState<'pastel' | 'barras'>('pastel');
  const [formatoEstudiantes, setFormatoEstudiantes] = useState<'barras' | 'pastel'>('barras');

  const handleCargarMetricas = async () => {
    // Validar rango de años razonable
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

  // Atajos rápidos de fecha
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

  // Escalas máximas para barras
  const maxHoras = Math.max(...(metricasData?.laboratorios?.map(l => l.horasUsoEfectivo) || [1]), 1);
  const maxReservas = Math.max(...(metricasData?.laboratorios?.map(l => l.totalReservas) || [1]), 1);
  const maxEstudiantes = Math.max(...(metricasData?.laboratorios?.map(l => l.alumnosBeneficiados) || [1]), 1);

  return (
    <div className="space-y-6">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-tech-blue" />
            Métricas de Ocupación e Informes Académicos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidado institucional de horas lectivas, tasas de aprovechamiento y exportación de datos para acreditación universitaria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/reportes/asistencias"
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition flex items-center shadow-xs"
          >
            <FileText className="w-4 h-4 mr-1.5 text-tech-blue" />
            Auditoría Diaria
          </Link>
          <button
            onClick={handleDescargarCsvMetricas}
            disabled={isDownloadingCsv || isLoadingMetricas}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center shadow-sm disabled:opacity-50"
            title="Descargar archivo CSV compatible con Excel con todas las métricas de ocupación"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloadingCsv ? 'Generando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={handleDescargarExcelMetricas}
            disabled={isDownloadingCsv || isLoadingMetricas}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center shadow-sm disabled:opacity-50"
            title="Descargar archivo Excel con formato de acreditación académica"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloadingCsv ? 'Generando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* Barra de Filtros con Atajos */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Desde</label>
            <input
              type="date"
              min="2020-01-01"
              max="2035-12-31"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Hasta</label>
            <input
              type="date"
              min="2020-01-01"
              max="2035-12-31"
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
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCargarMetricas}
              disabled={isLoadingMetricas}
              className="w-full py-2 bg-tech-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isLoadingMetricas ? 'Calculando...' : 'Aplicar Filtros'}
            </button>
          </div>
        </div>

        {/* Atajos Rápidos */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-400 mr-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" /> Atajos:
          </span>
          <button
            type="button"
            onClick={() => aplicarPreset('hoy')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('ultimos30')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('esteMes')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Este Mes
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('limpiar')}
            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
          >
            Limpiar Fechas
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Superiores */}
      {metricasData && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Horas de Práctica Efectiva</p>
              <p className="text-2xl font-bold font-poppins text-tech-blue mt-1">
                {metricasData.totalHorasCampus} hrs
              </p>
              <p className="text-[11px] text-slate-400 mt-1">En el período seleccionado</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-tech-blue rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Tasa de Asistencia Global</p>
              <p className="text-2xl font-bold font-poppins text-emerald-600 mt-1">
                {metricasData.tasaAsistenciaPromedio}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Aprovechamiento de aforo</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Estudiantes Beneficiados</p>
              <p className="text-2xl font-bold font-poppins text-indigo-600 mt-1">
                {metricasData.totalAlumnosBeneficiados}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Alumnos que cursaron prácticas</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-slate-500 uppercase font-semibold">Laboratorio Top Demanda</p>
              <p className="text-xl font-bold font-poppins text-slate-900 dark:text-white mt-1 truncate" title={metricasData.laboratorioMasDemandado}>
                {metricasData.laboratorioMasDemandado}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Mayor frecuencia de uso</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARDS VISUALES (GRÁFICOS EN PASTEL Y BARRAS) */}
      {metricasData && metricasData.laboratorios.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/80 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-tech-blue" />
                <h4 className="font-poppins font-bold text-slate-900 dark:text-white text-base">
                  Dashboard Analítico de Ocupación e Impacto
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Visualización gráfica de horas de uso efectivo, demanda por laboratorio y alumnos beneficiados
              </p>
            </div>

            {/* Pestañas del Dashboard */}
            <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setTabVisual('integral')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  tabVisual === 'integral'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Vista Integral
              </button>
              <button
                type="button"
                onClick={() => setTabVisual('horas')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  tabVisual === 'horas'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Horas de Uso</span>
              </button>
              <button
                type="button"
                onClick={() => setTabVisual('reservas')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  tabVisual === 'reservas'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Total Reservas</span>
              </button>
              <button
                type="button"
                onClick={() => setTabVisual('estudiantes')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  tabVisual === 'estudiantes'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Estudiantes</span>
              </button>
              <button
                type="button"
                onClick={() => setTabVisual('asistencia')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  tabVisual === 'asistencia'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprovechamiento (%)</span>
              </button>
            </div>
          </div>

          <div className="pt-6">
            
            {/* GRÁFICO 1: HORAS DE USO EFECTIVO */}
            {(tabVisual === 'horas' || tabVisual === 'integral') && (
              <div className="mb-6 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-tech-blue" />
                    <div>
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        Horas de Práctica Efectiva por Laboratorio
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Total consolidado: {metricasData.totalHorasCampus} hrs en el campus
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
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
                      <span>Pastel</span>
                    </button>
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
                        <div key={seg.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
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
                            {seg.valor} hrs ({seg.porcentaje}%)
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
                        <div key={lab.laboratorioId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                              <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                              {lab.nombre}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {lab.horasUsoEfectivo} hrs
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

            {/* GRÁFICO 2: TOTAL DE RESERVAS POR LABORATORIO */}
            {(tabVisual === 'reservas' || tabVisual === 'integral') && (
              <div className="mb-6 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-tech-blue" />
                    <div>
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        Total de Reservas y Frecuencia de Uso
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Total acumulado: {metricasData.totalReservasCampus} reservas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
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
                      <span>Pastel</span>
                    </button>
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
                        <div key={seg.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
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
                            {seg.valor} reservas ({seg.porcentaje}%)
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
                        <div key={lab.laboratorioId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                              <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                              {lab.nombre}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {lab.totalReservas} reservas
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

            {/* GRÁFICO 3: ALUMNOS BENEFICIADOS */}
            {(tabVisual === 'estudiantes' || tabVisual === 'integral') && (
              <div className="mb-6 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-tech-blue" />
                    <div>
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        Estudiantes Beneficiados por Laboratorio
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Total campus: {metricasData.totalAlumnosBeneficiados} estudiantes cursaron prácticas
                      </p>
                    </div>
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
                      <span>Pastel</span>
                    </button>
                  </div>
                </div>

                {formatoEstudiantes === 'barras' ? (
                  <div className="space-y-3 py-2">
                    {metricasData.laboratorios.map((lab, idx) => {
                      const porcentajeAncho = Math.round((lab.alumnosBeneficiados / maxEstudiantes) * 100);
                      const color = PALETA_COLORES[idx % PALETA_COLORES.length];

                      return (
                        <div key={lab.laboratorioId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
                              <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                              {lab.nombre}
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {lab.alumnosBeneficiados} alumnos
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
                        <div key={seg.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
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
                            {seg.valor} alumnos ({seg.porcentaje}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GRÁFICO 4: TASA DE ASISTENCIA Y APROVECHAMIENTO */}
            {(tabVisual === 'asistencia' || tabVisual === 'integral') && (
              <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Tasa de Asistencia Efectiva por Laboratorio
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Porcentaje de cumplimiento de reservas confirmadas por control QR
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
                      <div key={lab.laboratorioId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {lab.nombre}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {lab.tasaAsistencia}% ({lab.reservasAsistidas} asistidas / {lab.reservasAusentes} ausentes)
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

      {/* Tabla Detallada Institucional */}
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
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div>
                  </td>
                </tr>
              ) : !metricasData || metricasData.laboratorios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No hay registros de uso en el rango seleccionado
                  </td>
                </tr>
              ) : (
                metricasData.laboratorios.map((lab) => (
                  <tr
                    key={lab.laboratorioId}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">{lab.capacidad} Asientos</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{lab.totalReservas}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">{lab.reservasAsistidas}</td>
                    <td className="px-6 py-4 text-rose-500 font-semibold">{lab.reservasAusentes}</td>
                    <td className="px-6 py-4 font-mono font-bold text-tech-blue">{lab.horasUsoEfectivo} hrs</td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{lab.alumnosBeneficiados}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
