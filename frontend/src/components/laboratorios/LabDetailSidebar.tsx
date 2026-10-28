import { Box, MapPin, Navigation, CalendarPlus, Clock } from 'lucide-react';
import type { Laboratorio } from './LabDetailHeader';

export interface HorarioItem {
  id: number;
  dia: string;
  horaApertura: string;
  horaCierre: string;
}

interface LabDetailSidebarProps {
  lab: Laboratorio;
  horarios: HorarioItem[];
  getHorarioTimeStr: (isoString?: string) => string;
  onReservarGeneral: () => void;
}

export default function LabDetailSidebar({
  lab,
  horarios,
  getHorarioTimeStr,
  onReservarGeneral
}: LabDetailSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Equipamiento Disponible */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <h2 className="text-base font-poppins font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <Box className="w-4 h-4 mr-2 text-tech-blue" />
          Equipamiento Disponible
        </h2>

        {lab.equipos && lab.equipos.length > 0 ? (
          <ul className="space-y-2.5">
            {lab.equipos.map((eq, i) => (
              <li key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{eq.equipamiento.nombre}</p>
                  <p className="text-[11px] text-slate-400">{eq.equipamiento.tipo}</p>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
                  x{eq.cantidad}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-xs">No hay equipos registrados para este laboratorio.</p>
        )}
      </div>

      {/* Ubicacion y Mapa Interactivo del Campus FCyT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800/80 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-poppins font-bold text-slate-900 dark:text-white flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-rose-500" />
            Ubicación en el Campus
          </h2>
          {lab.latitud && lab.longitud && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
              {Number(lab.latitud).toFixed(4)}, {Number(lab.longitud).toFixed(4)}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          {lab.ubicacion || 'Campus Central FCyT - UMSS'}
        </p>

        {lab.latitud && lab.longitud ? (
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-inner relative h-48 bg-slate-100 dark:bg-slate-950">
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
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center text-xs text-slate-400">
            Ubicación en mapa no disponible.
          </div>
        )}

        {lab.latitud && lab.longitud && (
          <button
            type="button"
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${lab.latitud},${lab.longitud}&travelmode=walking`;
              window.open(url, '_blank');
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm shadow-emerald-500/20 flex items-center justify-center space-x-2 text-xs transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Cómo llegar (Navegación a pie)</span>
          </button>
        )}
      </div>

      {/* Accion Rapida de Reserva */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center text-sm">
          <CalendarPlus className="w-4 h-4 mr-2 text-tech-blue" />
          Reserva de Instalaciones
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Agendamiento oficial para prácticas y dictado de materias.
        </p>
        <button
          onClick={onReservarGeneral}
          className="w-full py-2.5 px-4 bg-tech-blue hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 text-xs transition-all cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Reservar Laboratorio</span>
        </button>
      </div>

      {/* Resumen de Horarios Semanales */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-tech-blue" />
          Horarios Operativos
        </h3>
        {horarios.length > 0 ? (
          <div className="space-y-1.5">
            {horarios.map((h) => (
              <div key={h.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
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
  );
}