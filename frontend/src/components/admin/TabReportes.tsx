import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Filter,
  Calendar,
  RotateCcw,
  FileText,
  BarChart3,
  Table,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { reportesApi } from '../../api/reportes.api';
import type { ResumenMetricasAcademicas, MetricasLaboratorio } from '../../types';
import KpiCardsReportes from './reportes/KpiCardsReportes';
import GraficosMetricasReportes from './reportes/GraficosMetricasReportes';
import TablaMetricasInstitucional from './reportes/TablaMetricasInstitucional';
import ModalDetalleLabReporte from './reportes/ModalDetalleLabReporte';

interface LaboratorioOption {
  id: number;
  nombre: string;
}

interface TabReportesProps {
  laboratorios: LaboratorioOption[];
}

export default function TabReportes({ laboratorios }: TabReportesProps) {
  const [metricasData, setMetricasData] = useState<ResumenMetricasAcademicas | null>(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroLabId, setFiltroLabId] = useState('');
  const [isLoadingMetricas, setIsLoadingMetricas] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const [modoVista, setModoVista] = useState<'graficos' | 'tabla'>('graficos');
  const [labDetalleModal, setLabDetalleModal] = useState<MetricasLaboratorio | null>(null);

  const handleCargarMetricas = async () => {
    if (filtroFechaInicio && filtroFechaFin && filtroFechaInicio > filtroFechaFin) {
      toast.error('La fecha inicial no puede ser posterior a la fecha final');
      return;
    }

    try {
      setIsLoadingMetricas(true);
      const data = await reportesApi.obtenerMetricas(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      setMetricasData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar métricas de ocupación');
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
      setFiltroLabId('');
    }
  };

  const handleDescargarCsvMetricas = async () => {
    try {
      setIsDownloadingCsv(true);
      toast.loading('Generando exportación de métricas...', { id: 'csv-download' });
      await reportesApi.descargarCsvMetricas(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      toast.success('Métricas exportadas correctamente', { id: 'csv-download' });
    } catch (error) {
      toast.error('Error al descargar el archivo CSV', { id: 'csv-download' });
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleDescargarExcelMetricas = async () => {
    try {
      setIsDownloadingCsv(true);
      toast.loading('Generando exportación en formato Excel...', { id: 'excel-download' });
      await reportesApi.descargarExcelMetricas(
        filtroFechaInicio || undefined,
        filtroFechaFin || undefined,
        filtroLabId ? Number(filtroLabId) : undefined
      );
      toast.success('Reporte Excel generado exitosamente', { id: 'excel-download' });
    } catch (error) {
      toast.error('Error al exportar en formato Excel', { id: 'excel-download' });
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-tech-blue" />
            Reportes y Estadísticas de Uso
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Resumen de horas de uso, reservas realizadas y estudiantes que asistieron a los laboratorios.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            to="/reportes/asistencias"
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center shadow-xs active:scale-[0.98] whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-1.5 text-tech-blue" />
            Registro de Asistencias
          </Link>
          <button
            onClick={handleDescargarCsvMetricas}
            disabled={isDownloadingCsv || isLoadingMetricas}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center shadow-sm shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            title="Descargar archivo CSV con el resumen de reservas y uso"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloadingCsv ? 'Generando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={handleDescargarExcelMetricas}
            disabled={isDownloadingCsv || isLoadingMetricas}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center shadow-sm shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            title="Descargar resumen de métricas en formato Excel"
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
      <KpiCardsReportes metricasData={metricasData} />

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
            <span>Gráficos</span>
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
            <span>Tabla Resumen</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: DASHBOARD GRÁFICO */}
      {modoVista === 'graficos' && metricasData && metricasData.laboratorios.length > 0 && (
        <GraficosMetricasReportes
          metricasData={metricasData}
          onSelectLab={(lab) => setLabDetalleModal(lab)}
        />
      )}

      {/* SECCIÓN 2: TABLA INSTITUCIONAL COMPACTA */}
      {modoVista === 'tabla' && (
        <TablaMetricasInstitucional
          metricasData={metricasData}
          isLoadingMetricas={isLoadingMetricas}
          onSelectLab={(lab) => setLabDetalleModal(lab)}
        />
      )}

      {/* MODAL: REPORTE DETALLADO POR LABORATORIO */}
      <ModalDetalleLabReporte
        lab={labDetalleModal}
        onClose={() => setLabDetalleModal(null)}
      />

    </div>
  );
}