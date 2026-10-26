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
      className={`rounded-3xl p-8 border shadow-lg animate-in zoom-in-95 duration-200 ${
        resultado.exito
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            resultado.exito
              ? 'bg-green-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          {resultado.exito ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>

        <div className="flex-1">
          <span
            className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 ${
              resultado.exito
                ? 'bg-green-200/70 text-green-900 dark:bg-green-900/60 dark:text-green-200'
                : 'bg-rose-200/70 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
            }`}
          >
            {resultado.exito ? 'Acceso Autorizado' : 'Acceso Denegado'}
          </span>

          <h2
            className={`text-xl font-poppins font-bold ${
              resultado.exito ? 'text-green-900 dark:text-green-200' : 'text-rose-900 dark:text-rose-200'
            }`}
          >
            {resultado.mensaje}
          </h2>

          {/* Datos de la persona y laboratorio si fue exitoso */}
          {resultado.exito && resultado.data && (
            <div className="mt-4 pt-4 border-t border-green-200/70 dark:border-green-800/60 space-y-2 text-sm text-green-900 dark:text-green-100">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                <span className="font-bold">{resultado.data.usuario?.nombreCompleto}</span>
                <span className="text-xs text-green-700 dark:text-green-300 ml-2">
                  ({resultado.data.usuario?.correo})
                </span>
              </div>

              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                <span>{resultado.data.laboratorio?.nombre}</span>
                {resultado.data.laboratorio?.ubicacion && (
                  <span className="text-xs text-green-700 dark:text-green-300 ml-2">
                    [{resultado.data.laboratorio.ubicacion}]
                  </span>
                )}
              </div>

              {resultado.data.numeroComputadora && (
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  <span className="font-bold">Computadora asignada: PC #{resultado.data.numeroComputadora}</span>
                </div>
              )}

              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                <span>Sello de Asistencia: {new Date(resultado.data.horaAsistencia).toLocaleTimeString('es-ES')}</span>
              </div>
            </div>
          )}

          {/* Detalles adicionales si fue error */}
          {!resultado.exito && resultado.detalles && (
            <div className="mt-3 text-xs text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/30 p-3 rounded-xl">
              {resultado.detalles.horaAsistenciaRegistrada && (
                <p>Asistencia registrada previamente el {new Date(resultado.detalles.horaAsistenciaRegistrada).toLocaleString('es-ES')}</p>
              )}
              {resultado.detalles.horaInicio && (
                <p>Horario pactado: {new Date(resultado.detalles.horaInicio).toLocaleString('es-ES')}</p>
              )}
            </div>
          )}

          {/* Boton Reanudar */}
          <button
            onClick={onReanudar}
            className={`mt-6 w-full sm:w-auto font-bold py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md text-sm cursor-pointer ${
              resultado.exito
                ? 'bg-green-700 hover:bg-green-800 text-white'
                : 'bg-rose-700 hover:bg-rose-800 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Escanear Siguiente Reserva</span>
          </button>
        </div>
      </div>
    </div>
  );
}
