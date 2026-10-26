import { Calendar, CalendarRange, Filter } from 'lucide-react';

interface CarreraItem {
  id: number;
  nombre: string;
}

interface LaboratorioItem {
  id: number;
  nombre: string;
}

interface FiltrosReporteAsistenciasProps {
  modoAuditoria: 'dia' | 'rango';
  setModoAuditoria: (modo: 'dia' | 'rango') => void;
  fecha: string;
  setFecha: (f: string) => void;
  fechaInicio: string;
  setFechaInicio: (f: string) => void;
  fechaFin: string;
  setFechaFin: (f: string) => void;
  carreraId: string;
  setCarreraId: (id: string) => void;
  carreras: CarreraItem[];
  laboratorioId: string;
  setLaboratorioId: (id: string) => void;
  laboratorios: LaboratorioItem[];
  onAplicarPreset: (preset: 'hoy' | 'ultimos7' | 'esteMes' | 'ultimos30') => void;
}

export default function FiltrosReporteAsistencias({
  modoAuditoria,
  setModoAuditoria,
  fecha,
  setFecha,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  carreraId,
  setCarreraId,
  carreras,
  laboratorioId,
  setLaboratorioId,
  laboratorios,
  onAplicarPreset
}: FiltrosReporteAsistenciasProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700/80 gap-3">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
          <Filter className="w-4 h-4 text-tech-blue" />
          <span>Filtros y Parámetros de Auditoría</span>
        </div>

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

        <div>
          <label htmlFor="filtro-carrera" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Filtrar por Carrera
          </label>
          <select
            id="filtro-carrera"
            value={carreraId}
            onChange={(e) => setCarreraId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
          >
            <option value="">Todas las carreras</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-laboratorio" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Laboratorio Específico
          </label>
          <select
            id="filtro-laboratorio"
            value={laboratorioId}
            onChange={(e) => setLaboratorioId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
          >
            <option value="">Todos los laboratorios</option>
            {laboratorios.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {modoAuditoria === 'rango' && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Atajos rápidos:</span>
          <button
            type="button"
            onClick={() => onAplicarPreset('hoy')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onAplicarPreset('ultimos7')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            onClick={() => onAplicarPreset('esteMes')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
          >
            Este Mes
          </button>
          <button
            type="button"
            onClick={() => onAplicarPreset('ultimos30')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200"
          >
            Últimos 30 días
          </button>
        </div>
      )}
    </section>
  );
}