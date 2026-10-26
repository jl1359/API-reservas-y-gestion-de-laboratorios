import { Monitor, Users, MapPin } from 'lucide-react';

export interface Equipamiento {
  id: number;
  nombre: string;
  tipo: string;
}

export interface LabEquipo {
  cantidad: number;
  equipamiento: Equipamiento;
}

export interface Laboratorio {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string | null;
  latitud?: number | null;
  longitud?: number | null;
  imagenUrl: string | null;
  reservaPorComputadora: boolean;
  equipos: LabEquipo[];
  carrera: { nombre: string } | null;
}

interface LabDetailHeaderProps {
  lab: Laboratorio;
  puedeReservarComputadora: boolean;
  onReservarComputadora: () => void;
  onReservarLaboratorio: () => void;
}

export default function LabDetailHeader({
  lab,
  puedeReservarComputadora,
  onReservarComputadora,
  onReservarLaboratorio
}: LabDetailHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row gap-8 items-start mb-8 transition-all">
      <div className="w-full md:w-1/3 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative flex-shrink-0">
        {lab.imagenUrl ? (
          <img src={lab.imagenUrl} alt={lab.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-umss-blue to-tech-blue opacity-90 flex items-center justify-center">
            <Monitor className="w-20 h-20 text-white/50" />
          </div>
        )}
      </div>

      <div className="flex-1 w-full">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-tech-blue dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-blue-200/60 dark:border-blue-900/40">
          {lab.carrera ? lab.carrera.nombre : 'Uso General FCyT'}
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-poppins font-bold text-slate-900 dark:text-white mb-4">
          {lab.nombre}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <Users className="w-4 h-4 text-tech-blue mb-1" />
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Capacidad</p>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{lab.capacidad} asientos</p>
          </div>
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <MapPin className="w-4 h-4 text-tech-blue mb-1" />
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Ubicación</p>
            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{lab.ubicacion || 'Campus Central'}</p>
          </div>
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 col-span-2 sm:col-span-1">
            <Monitor className="w-4 h-4 text-tech-blue mb-1" />
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Modalidad</p>
            <p className="font-bold text-sm text-slate-900 dark:text-white truncate" title={lab.reservaPorComputadora ? 'Por Puesto' : 'Aula Completa'}>
              {lab.reservaPorComputadora ? 'Por Puesto' : 'Aula Completa'}
            </p>
          </div>
        </div>

        {puedeReservarComputadora ? (
          <button
            type="button"
            onClick={onReservarComputadora}
            className="w-full sm:w-auto bg-tech-blue hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-2xl shadow-md shadow-blue-500/25 transition-all text-sm cursor-pointer"
          >
            Reservar Computadora
          </button>
        ) : (
          <button
            type="button"
            onClick={onReservarLaboratorio}
            className="w-full sm:w-auto bg-tech-blue hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-2xl shadow-md shadow-blue-500/25 transition-all text-sm cursor-pointer"
          >
            Reservar Laboratorio
          </button>
        )}
      </div>
    </div>
  );
}
