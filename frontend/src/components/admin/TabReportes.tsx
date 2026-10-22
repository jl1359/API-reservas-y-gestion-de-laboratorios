import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, FileText, Download } from 'lucide-react';
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

export default function TabReportes({ laboratorios }: TabReportesProps) {
  const [metricasData, setMetricasData] = useState<ResumenMetricasAcademicas | null>(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroLabId, setFiltroLabId] = useState('');
  const [isLoadingMetricas, setIsLoadingMetricas] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const handleCargarMetricas = async () => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-tech-blue" />
            Métricas de Ocupación e Informes Académicos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
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

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Desde</label>
          <input
            type="date"
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-tech-blue dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Hasta</label>
          <input
            type="date"
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

        <div className="flex items-end space-x-2">
          <button
            onClick={handleCargarMetricas}
            disabled={isLoadingMetricas}
            className="w-full py-2 bg-tech-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {isLoadingMetricas ? 'Calculando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      {metricasData && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Horas de Práctica Efectiva</p>
            <p className="text-2xl font-bold font-poppins text-tech-blue mt-1">
              {metricasData.totalHorasCampus} hrs
            </p>
            <p className="text-[11px] text-slate-400 mt-1">En el período seleccionado</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Tasa de Asistencia Global</p>
            <p className="text-2xl font-bold font-poppins text-emerald-600 mt-1">
              {metricasData.tasaAsistenciaPromedio}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Aprovechamiento de aforo</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Estudiantes Beneficiados</p>
            <p className="text-2xl font-bold font-poppins text-indigo-600 mt-1">
              {metricasData.totalAlumnosBeneficiados}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Alumnos que cursaron prácticas</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Laboratorio Top Demanda</p>
            <p className="text-xl font-bold font-poppins text-slate-900 dark:text-white mt-1 truncate" title={metricasData.laboratorioMasDemandado}>
              {metricasData.laboratorioMasDemandado}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Mayor frecuencia de uso y reservas</p>
          </div>
        </div>
      )}

      {/* Tabla Detallada */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
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
                      <p className="text-xs text-slate-500">{lab.ubicacion}</p>
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
