import { useState, useMemo } from 'react';
import {
  BarChart3,
  Clock,
  Building2,
  Users,
  CheckCircle2
} from 'lucide-react';
import type { ResumenMetricasAcademicas, MetricasLaboratorio } from '../../../types';
import GraficoPastelBarrasMetrica, { type SegmentoMetrica } from './GraficoPastelBarrasMetrica';
import GraficoMetricaAsistencia from './GraficoMetricaAsistencia';

const PALETA_COLORES = [
  '#0284c7', // Sky 600
  '#4f46e5', // Indigo 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#e11d48', // Rose 600
  '#8b5cf6', // Violet 600
  '#0d9488', // Teal 600
  '#ea580c', // Orange 600
  '#0891b2', // Cyan 600
  '#475569'  // Slate 600
];

interface GraficosMetricasReportesProps {
  metricasData: ResumenMetricasAcademicas;
  onSelectLab: (lab: MetricasLaboratorio) => void;
}

export default function GraficosMetricasReportes({
  metricasData,
  onSelectLab
}: GraficosMetricasReportesProps) {
  const [tabGrafico, setTabGrafico] = useState<'horas' | 'reservas' | 'estudiantes' | 'asistencia'>('horas');
  const [formatoHoras, setFormatoHoras] = useState<'pastel' | 'barras'>('pastel');
  const [formatoReservas, setFormatoReservas] = useState<'pastel' | 'barras'>('pastel');
  const [formatoEstudiantes, setFormatoEstudiantes] = useState<'barras' | 'pastel'>('barras');

  const maxHoras = Math.max(...metricasData.laboratorios.map((l) => l.horasUsoEfectivo), 1);
  const maxReservas = Math.max(...metricasData.laboratorios.map((l) => l.totalReservas), 1);
  const maxEstudiantes = Math.max(...metricasData.laboratorios.map((l) => l.alumnosBeneficiados), 1);

  const segmentosPastelHoras: SegmentoMetrica[] = useMemo(() => {
    const labs = metricasData.laboratorios || [];
    const totalHoras = metricasData.totalHorasCampus || 0;
    if (totalHoras === 0 || labs.length === 0) return [];

    const circumference = 2 * Math.PI * 40;
    let accumulatedOffset = 0;

    return labs.map((lab, index) => {
      const percentage = (lab.horasUsoEfectivo / totalHoras) * 100;
      const strokeLength = (percentage / 100) * circumference;
      const strokeDasharray = `${strokeLength} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        id: lab.laboratorioId,
        nombre: lab.nombre,
        valor: lab.horasUsoEfectivo,
        porcentaje: Math.round(percentage),
        color: PALETA_COLORES[index % PALETA_COLORES.length],
        strokeDasharray,
        strokeDashoffset,
        lab
      };
    });
  }, [metricasData]);

  const segmentosPastelReservas: SegmentoMetrica[] = useMemo(() => {
    const labs = metricasData.laboratorios || [];
    const totalReservas = metricasData.totalReservasCampus || 0;
    if (totalReservas === 0 || labs.length === 0) return [];

    const circumference = 2 * Math.PI * 40;
    let accumulatedOffset = 0;

    return labs.map((lab, index) => {
      const percentage = (lab.totalReservas / totalReservas) * 100;
      const strokeLength = (percentage / 100) * circumference;
      const strokeDasharray = `${strokeLength} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        id: lab.laboratorioId,
        nombre: lab.nombre,
        valor: lab.totalReservas,
        porcentaje: Math.round(percentage),
        color: PALETA_COLORES[index % PALETA_COLORES.length],
        strokeDasharray,
        strokeDashoffset,
        lab
      };
    });
  }, [metricasData]);

  const segmentosPastelEstudiantes: SegmentoMetrica[] = useMemo(() => {
    const labs = metricasData.laboratorios || [];
    const totalAlumnos = metricasData.totalAlumnosBeneficiados || 0;
    if (totalAlumnos === 0 || labs.length === 0) return [];

    const circumference = 2 * Math.PI * 40;
    let accumulatedOffset = 0;

    return labs.map((lab, index) => {
      const percentage = (lab.alumnosBeneficiados / totalAlumnos) * 100;
      const strokeLength = (percentage / 100) * circumference;
      const strokeDasharray = `${strokeLength} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        id: lab.laboratorioId,
        nombre: lab.nombre,
        valor: lab.alumnosBeneficiados,
        porcentaje: Math.round(percentage),
        color: PALETA_COLORES[index % PALETA_COLORES.length],
        strokeDasharray,
        strokeDashoffset,
        lab
      };
    });
  }, [metricasData]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Navegacion por Metricas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800 gap-3">
        <div>
          <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-tech-blue" />
            Estadísticas y Gráficos de Uso
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Haz clic en cualquier laboratorio para inspeccionar su reporte detallado
          </p>
        </div>

        {/* Selector de Metrica */}
        <div className="flex flex-wrap items-center bg-slate-100/90 dark:bg-slate-950/60 p-1.5 rounded-2xl text-xs font-semibold gap-1 border border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => setTabGrafico('horas')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
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
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
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
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
              tabGrafico === 'estudiantes'
                ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Estudiantes Asistentes</span>
          </button>

          <button
            type="button"
            onClick={() => setTabGrafico('asistencia')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
              tabGrafico === 'asistencia'
                ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>% de Asistencia</span>
          </button>
        </div>
      </div>

      <div className="pt-6">
        {/* GRAFICO A: HORAS DE USO */}
        {tabGrafico === 'horas' && (
          <GraficoPastelBarrasMetrica
            titulo="Distribución de Horas de Uso por Laboratorio"
            subtitulo={`Total campus: ${metricasData.totalHorasCampus} hrs`}
            totalCentro={metricasData.totalHorasCampus}
            etiquetaCentro="Horas Totales"
            unidad="hrs"
            formato={formatoHoras}
            onToggleFormato={setFormatoHoras}
            segmentos={segmentosPastelHoras}
            laboratorios={metricasData.laboratorios.map(l => ({
              laboratorioId: l.laboratorioId,
              nombre: l.nombre,
              valor: l.horasUsoEfectivo,
              lab: l
            }))}
            maxValor={maxHoras}
            paletaColores={PALETA_COLORES}
            onSelectLab={onSelectLab}
          />
        )}

        {/* GRAFICO B: TOTAL DE RESERVAS */}
        {tabGrafico === 'reservas' && (
          <GraficoPastelBarrasMetrica
            titulo="Cantidad de Reservas por Laboratorio"
            subtitulo={`Total acumulado: ${metricasData.totalReservasCampus} reservas`}
            totalCentro={metricasData.totalReservasCampus}
            etiquetaCentro="Reservas"
            unidad="reservas"
            formato={formatoReservas}
            onToggleFormato={setFormatoReservas}
            segmentos={segmentosPastelReservas}
            laboratorios={metricasData.laboratorios.map(l => ({
              laboratorioId: l.laboratorioId,
              nombre: l.nombre,
              valor: l.totalReservas,
              lab: l
            }))}
            maxValor={maxReservas}
            paletaColores={PALETA_COLORES}
            onSelectLab={onSelectLab}
          />
        )}

        {/* GRAFICO C: ESTUDIANTES */}
        {tabGrafico === 'estudiantes' && (
          <GraficoPastelBarrasMetrica
            titulo="Estudiantes que Asistieron por Laboratorio"
            subtitulo={`Total campus: ${metricasData.totalAlumnosBeneficiados} estudiantes`}
            totalCentro={metricasData.totalAlumnosBeneficiados}
            etiquetaCentro="Estudiantes"
            unidad="alumnos"
            formato={formatoEstudiantes}
            onToggleFormato={setFormatoEstudiantes}
            segmentos={segmentosPastelEstudiantes}
            laboratorios={metricasData.laboratorios.map(l => ({
              laboratorioId: l.laboratorioId,
              nombre: l.nombre,
              valor: l.alumnosBeneficiados,
              lab: l
            }))}
            maxValor={maxEstudiantes}
            paletaColores={PALETA_COLORES}
            onSelectLab={onSelectLab}
          />
        )}

        {/* GRAFICO D: PORCENTAJE DE ASISTENCIA */}
        {tabGrafico === 'asistencia' && (
          <GraficoMetricaAsistencia
            metricasData={metricasData}
            onSelectLab={onSelectLab}
          />
        )}
      </div>
    </div>
  );
}