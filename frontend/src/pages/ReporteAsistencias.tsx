import { useState, useEffect, useCallback } from 'react';
import { FileText, BarChart3, GraduationCap, Download, RefreshCw, ArrowLeft, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import apiClient from '../api/client';
import FiltrosReporteAsistencias from '../components/reportes/FiltrosReporteAsistencias';
import KpiResumenAsistencias from '../components/reportes/KpiResumenAsistencias';
import ChartCarrerasReporte from '../components/reportes/ChartCarrerasReporte';
import ChartLaboratoriosReporte from '../components/reportes/ChartLaboratoriosReporte';
import ChartDiasReporte from '../components/reportes/ChartDiasReporte';
import ChartEstadosYHorariosReporte from '../components/reportes/ChartEstadosYHorariosReporte';
import TablaAuditoriaAsistencias from '../components/reportes/TablaAuditoriaAsistencias';
import { useReporteAsistenciasCalculos, type ReporteData, PALETA_COLORES } from '../hooks/useReporteAsistenciasCalculos';
import { exportarReporteExcel, exportarReporteCsv } from '../utils/exportDatasetPowerBI';
import { imprimirReporteAuditoriaPdf } from '../utils/reporteAuditoriaPdf';

interface LaboratorioOpcion {
  id: number;
  nombre: string;
  carreraId?: number | null;
}

interface CarreraOpcion {
  id: number;
  nombre: string;
}

export default function ReporteAsistencias() {
  const hoyStr = new Date().toISOString().slice(0, 10);
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

  const {
    total, asistencias, ausencias, porcentajeAsistencia, carreraTop, labTop, diaTop,
    maxCarreraReservas, maxLabReservas, maxDiaReservas, segmentosPastelCarreras,
    segmentosPastelEstados, segmentosPastelLabs, segmentosPastelDias, distribucionHoraria
  } = useReporteAsistenciasCalculos(reporte);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLabs, resCarreras] = await Promise.all([
          apiClient.get('/api/laboratorios'),
          apiClient.get('/api/carreras').catch(() => ({ data: [] }))
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

  const aplicarPreset = (tipo: 'hoy' | 'ultimos7' | 'esteMes' | 'ultimos30') => {
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
    } else if (tipo === 'ultimos30') {
      const pasada = new Date(ahora.getTime() - 29 * 24 * 60 * 60 * 1000);
      setFechaInicio(formato(pasada));
      setFechaFin(formato(ahora));
    }
  };

  const consultarReporte = useCallback(async (mostrarFeedback = false) => {
    try {
      if (mostrarFeedback) setIsRefreshing(true);
      else setIsLoading(true);

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

      if (laboratorioId) params.laboratorioId = laboratorioId;
      if (carreraId) params.carreraId = carreraId;

      const res = await apiClient.get('/api/reportes/asistencias', { params });
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

  const formatearFecha = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoDate.slice(0, 10);
    }
  };

  const nombreCarreraFiltro = carreras.find(c => c.id === Number(carreraId))?.nombre;
  const nombreLaboratorioFiltro = laboratorios.find(l => l.id === Number(laboratorioId))?.nombre;

  const handleGuardarPdf = () => {
    imprimirReporteAuditoriaPdf(reporte, {
      modoAuditoria,
      fecha,
      fechaInicio,
      fechaFin,
      carreraNombre: nombreCarreraFiltro,
      laboratorioNombre: nombreLaboratorioFiltro
    });
  };

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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportarReporteExcel(reporte?.reservas, modoAuditoria, fecha, fechaInicio, fechaFin)}
              type="button"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-medium transition-all shadow-sm text-xs sm:text-sm cursor-pointer"
              title="Descarga el reporte de asistencias en formato oficial de Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={() => exportarReporteCsv(reporte?.reservas, modoAuditoria, fecha, fechaInicio, fechaFin)}
              type="button"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl font-medium transition-all shadow-sm text-xs sm:text-sm cursor-pointer"
              title="Descarga el reporte de asistencias en formato estándar CSV (.csv)"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={handleGuardarPdf}
              type="button"
              className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl font-medium transition-all shadow-sm text-xs sm:text-sm cursor-pointer"
              title="Genera el reporte oficial de auditoría para guardar en PDF o imprimir"
            >
              <FileText className="w-4 h-4" />
              <span>Guardar en PDF</span>
            </button>
            <button
              onClick={() => consultarReporte(true)}
              disabled={isRefreshing || isLoading}
              type="button"
              className="inline-flex items-center space-x-2 bg-tech-blue hover:bg-blue-600 disabled:opacity-60 text-white px-3.5 py-2 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 text-xs sm:text-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <FiltrosReporteAsistencias
          modoAuditoria={modoAuditoria} setModoAuditoria={setModoAuditoria}
          fecha={fecha} setFecha={setFecha}
          fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
          fechaFin={fechaFin} setFechaFin={setFechaFin}
          carreraId={carreraId} setCarreraId={setCarreraId}
          carreras={carreras} laboratorioId={laboratorioId}
          setLaboratorioId={setLaboratorioId} laboratorios={laboratorios}
          onAplicarPreset={aplicarPreset}
        />

        {/* Tarjetas de Estadísticas Principales (KPIs) */}
        <KpiResumenAsistencias
          modoAuditoria={modoAuditoria} total={total}
          asistencias={asistencias} ausencias={ausencias}
          porcentajeAsistencia={porcentajeAsistencia}
          carreraTop={carreraTop} labTop={labTop} diaTop={diaTop}
          isLoading={isLoading} formatearFecha={formatearFecha}
        />

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
              className="text-tech-blue dark:text-blue-400 hover:underline font-semibold self-start sm:self-auto cursor-pointer"
            >
              Restablecer a Todas las Carreras
            </button>
          </div>
        )}

        {/* SECCIÓN ANALÍTICA COMPLETA */}
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

            <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl text-xs font-semibold gap-1 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTabAnalitica('integral')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tabAnalitica === 'integral'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Vista Integral
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('carreras')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tabAnalitica === 'carreras'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Por Carreras
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('labs')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tabAnalitica === 'labs'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Por Laboratorios
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('dias')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tabAnalitica === 'dias'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Por Días
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('estados')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tabAnalitica === 'estados'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Estados Asistencia
              </button>
              <button
                type="button"
                onClick={() => setTabAnalitica('horarios')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tabAnalitica === 'horarios'
                    ? 'bg-white dark:bg-slate-800 text-tech-blue dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Horarios Pico
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue"></div>
            </div>
          ) : !reporte || total === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              <PieChart className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p>No hay datos estadísticos disponibles para el período o filtros seleccionados.</p>
            </div>
          ) : (
            <div className="pt-6">
              {/* VISTA A: POR CARRERAS */}
              {(tabAnalitica === 'carreras' || tabAnalitica === 'integral') && (
                <ChartCarrerasReporte
                  formato={formatoGraficoCarreras}
                  onToggleFormato={setFormatoGraficoCarreras}
                  segmentos={segmentosPastelCarreras}
                  carrerasList={reporte?.resumen?.porCarrera}
                  maxReservas={maxCarreraReservas}
                  paletaColores={PALETA_COLORES}
                  onSelectCarrera={(cId, nombre) => {
                    setCarreraId(String(cId));
                    toast.success(`Filtrando auditoría por: ${nombre}`);
                  }}
                />
              )}

              {/* VISTA B: POR LABORATORIOS */}
              {(tabAnalitica === 'labs' || tabAnalitica === 'integral') && (
                <ChartLaboratoriosReporte
                  formato={formatoGraficoLabs}
                  onToggleFormato={setFormatoGraficoLabs}
                  segmentos={segmentosPastelLabs}
                  laboratoriosList={reporte?.resumen?.porLaboratorio}
                  maxReservas={maxLabReservas}
                  paletaColores={PALETA_COLORES}
                  total={total}
                  carreraId={carreraId}
                  nombreCarreraFiltro={nombreCarreraFiltro}
                />
              )}

              {/* VISTA C: POR DÍAS */}
              {(tabAnalitica === 'dias' || tabAnalitica === 'integral') && (
                <ChartDiasReporte
                  formato={formatoGraficoDias}
                  onToggleFormato={setFormatoGraficoDias}
                  segmentos={segmentosPastelDias}
                  diasList={reporte?.resumen?.porDia}
                  maxDiaReservas={maxDiaReservas}
                  diaTop={diaTop}
                  totalDias={reporte?.resumen?.porDia?.length || 0}
                />
              )}

              {/* VISTA D: ESTADOS Y HORARIOS */}
              <ChartEstadosYHorariosReporte
                tabAnalitica={tabAnalitica}
                segmentosEstados={segmentosPastelEstados}
                porcentajeAsistencia={porcentajeAsistencia}
                distribucionHoraria={distribucionHoraria}
              />
            </div>
          )}
        </section>

        {/* Tabla Detallada de Reservas y Trazabilidad */}
        <TablaAuditoriaAsistencias
          reservas={reporte?.reservas}
          isLoading={isLoading}
          modoAuditoria={modoAuditoria}
          fecha={fecha}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          carreraId={carreraId}
          laboratorioId={laboratorioId}
          nombreCarreraFiltro={nombreCarreraFiltro}
        />
      </main>
    </div>
  );
}