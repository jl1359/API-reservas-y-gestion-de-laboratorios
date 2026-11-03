import {
  CheckCircle2,
  XCircle,
  User,
  MapPin,
  Monitor,
  Clock,
  RefreshCw
} from 'lucide-react';

export interface ResultadoEscaneo {
  exito: boolean;
  mensaje: string;
  codigo?: string;
  data?: {
    reservaId: number;
    estado: string;
    horaAsistencia: string;
    usuario?: { id: number; nombreCompleto: string; ci?: string; correo: string };
    laboratorio?: { id: number; nombre: string; ubicacion?: string; reservaPorComputadora?: boolean };
    numeroComputadora?: number | null;
    fechaInicio?: string;
    fechaFin?: string;
    materia?: string | null;
    motivo?: string | null;
  };
  detalles?: any;
}

interface TarjetaResultadoEscaneoProps {
  resultado: ResultadoEscaneo;
  onReanudar: () => void;
}

export default function TarjetaResultadoEscaneo({
  resultado,
  onReanudar
}: TarjetaResultadoEscaneoProps) {
  return (
    <div
      className={`rounded-3xl p-4 sm:p-7 border shadow-lg overflow-hidden w-full max-w-full box-border transition-all animate-in zoom-in-95 duration-200 ${
        resultado.exito
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
      }`}
    >
      {/* Encabezado: Icono + Estado + Mensaje principal */}
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
        <div
          className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${
            resultado.exito
              ? 'bg-green-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          {resultado.exito ? <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" /> : <XCircle className="w-6 h-6 sm:w-8 sm:h-8" />}
        </div>

        <div className="flex-1 min-w-0">
          <span
            className={`inline-block text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 ${
              resultado.exito
                ? 'bg-green-200/70 text-green-900 dark:bg-green-900/60 dark:text-green-200'
                : 'bg-rose-200/70 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
            }`}
          >
            {resultado.exito ? 'Acceso Autorizado' : 'Acceso Denegado'}
          </span>

          <h2
            className={`text-base sm:text-xl font-poppins font-bold leading-snug break-words ${
              resultado.exito ? 'text-green-900 dark:text-green-200' : 'text-rose-900 dark:text-rose-200'
            }`}
          >
            {resultado.mensaje}
          </h2>
        </div>
      </div>

      {/* Datos del usuario y laboratorio */}
      {resultado.exito && resultado.data && (
        <div className="pt-3.5 border-t border-green-200/70 dark:border-green-800/60 space-y-3 text-xs sm:text-sm text-green-900 dark:text-green-100">
          <div className="flex items-start space-x-2.5">
            <User className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
            <div className="min-w-0 flex-1 flex flex-col">
              <span className="font-bold break-words">{resultado.data.usuario?.nombreCompleto}</span>
              {resultado.data.usuario?.correo && (
                <span className="text-[11px] sm:text-xs text-green-700 dark:text-green-300 break-all">
                  ({resultado.data.usuario.correo})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <MapPin className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
            <div className="min-w-0 flex-1 flex flex-col">
              <span className="font-medium break-words">{resultado.data.laboratorio?.nombre}</span>
              {resultado.data.laboratorio?.ubicacion && (
                <span className="text-[11px] sm:text-xs text-green-700 dark:text-green-300 break-words">
                  [{resultado.data.laboratorio.ubicacion}]
                </span>
              )}
            </div>
          </div>

          {resultado.data.numeroComputadora && (
            <div className="flex items-center space-x-2.5">
              <Monitor className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="font-bold break-words">Computadora asignada: PC #{resultado.data.numeroComputadora}</span>
            </div>
          )}

          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span className="break-words">Sello de Asistencia: <strong>{new Date(resultado.data.horaAsistencia).toLocaleTimeString('es-ES', { timeZone: 'America/La_Paz' })}</strong></span>
          </div>
        </div>
      )}

      {/* Detalles si fue error */}
      {!resultado.exito && resultado.detalles && (
        <div className="mt-3 text-xs text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/30 p-3 rounded-xl break-words">
          {resultado.detalles.horaAsistenciaRegistrada && (
            <p>Asistencia registrada previamente el {new Date(resultado.detalles.horaAsistenciaRegistrada).toLocaleString('es-ES', { timeZone: 'America/La_Paz' })}</p>
          )}
          {resultado.detalles.horaInicio && (
            <p>Horario pactado: {new Date(resultado.detalles.horaInicio).toLocaleString('es-ES', { timeZone: 'America/La_Paz' })}</p>
          )}
        </div>
      )}

      {/* Boton Reanudar */}
      <div className="mt-5 pt-3 border-t border-green-200/50 dark:border-green-800/40">
        <button
          type="button"
          onClick={onReanudar}
          className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md text-sm cursor-pointer ${
            resultado.exito
              ? 'bg-green-700 hover:bg-green-800 text-white'
              : 'bg-rose-700 hover:bg-rose-800 text-white'
          }`}
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>Escanear Siguiente Reserva</span>
        </button>
      </div>
    </div>
  );
}