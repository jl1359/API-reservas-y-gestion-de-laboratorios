import {
  Calendar,
  Clock,
  MapPin,
  Monitor,
  CheckCircle,
  AlertCircle,
  QrCode,
  FileText,
  CalendarPlus,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { generarEnlaceGoogleCalendar, descargarArchivoIcs } from '../../utils/calendar';
import { imprimirBoletaOficial } from '../../utils/boletaPdf';

export interface ReservaPerfil {
  id: number;
  tokenQr?: string | null;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
  materia?: string | null;
  numeroComputadora?: number | null;
  estado: string;
  horaAsistencia?: string | null;
  laboratorio: {
    nombre: string;
    ubicacion?: string | null;
    reservaPorComputadora?: boolean;
  };
}

interface ListaMisReservasPerfilProps {
  isLoading: boolean;
  reservas: ReservaPerfil[];
  usuario: any;
  onAbrirQr: (reserva: ReservaPerfil) => void;
  onAbrirCancelar: (reserva: ReservaPerfil) => void;
  onVerCatalogo: () => void;
}

export default function ListaMisReservasPerfil({
  isLoading,
  reservas,
  usuario,
  onAbrirQr,
  onAbrirCancelar,
  onVerCatalogo
}: ListaMisReservasPerfilProps) {
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-blue mx-auto mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando reservas...</p>
      </div>
    );
  }

  if (reservas.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
        <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Aún no tienes reservas registradas</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
          Explora el catálogo de laboratorios para agendar un aula o puesto de computadora.
        </p>
        <button
          onClick={onVerCatalogo}
          className="mt-6 bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all text-sm"
        >
          Ver Catálogo de Laboratorios
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservas.map((reserva) => {
        const inicio = new Date(reserva.fechaInicio);
        const fin = new Date(reserva.fechaFin);
        const esAprobada = reserva.estado === 'Aprobada';
        const yaAsistio = reserva.estado === 'Asistió';

        return (
          <div
            key={reserva.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-blue-500/30"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    esAprobada
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : yaAsistio
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      : reserva.estado === 'Pendiente'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}
                >
                  {reserva.estado}
                </span>

                {reserva.numeroComputadora && (
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-0.5 rounded-full flex items-center">
                    <Monitor className="w-3 h-3 mr-1 text-tech-blue" /> PC #{reserva.numeroComputadora}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-poppins font-bold text-slate-900 dark:text-white">
                {reserva.laboratorio?.nombre || 'Laboratorio'}
              </h3>

              <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                {reserva.laboratorio.ubicacion && (
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {reserva.laboratorio.ubicacion}
                  </span>
                )}
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {inicio.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}{' '}
                  ({inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>

              {reserva.motivo && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 italic">
                  Motivo: "{reserva.motivo}"
                </p>
              )}

              {yaAsistio && reserva.horaAsistencia && (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2 flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Asistencia registrada:{' '}
                  {new Date(reserva.horaAsistencia).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* Botones de Acción (QR, Boleta PDF, Calendarios y Cancelación) */}
            <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-2">
              {esAprobada && (
                <>
                  <button
                    onClick={() => onAbrirQr(reserva)}
                    className="inline-flex items-center justify-center space-x-1.5 bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white font-semibold py-2 px-3.5 rounded-xl shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 transition-all text-xs"
                    title="Ver pase QR de ingreso"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR</span>
                  </button>

                  <button
                    onClick={() => imprimirBoletaOficial({
                      ...reserva,
                      usuario: {
                        nombreCompleto: usuario?.nombreCompleto || usuario?.nombre || 'Usuario UMSS',
                        correo: usuario?.correo || '',
                        ci: usuario?.ci || null
                      }
                    })}
                    className="inline-flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-100 font-semibold py-2 px-3.5 rounded-xl border border-slate-700/60 dark:border-slate-700 transition-all text-xs active:scale-[0.98]"
                    title="Guardar o imprimir boleta oficial en PDF"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Guardar en PDF</span>
                  </button>

                  <button
                    onClick={() => window.open(generarEnlaceGoogleCalendar(reserva), '_blank')}
                    className="inline-flex items-center justify-center space-x-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-xl transition-all text-xs active:scale-[0.98]"
                    title="Agregar a Google Calendar"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Cal</span>
                  </button>

                  <button
                    onClick={() => descargarArchivoIcs(reserva)}
                    className="inline-flex items-center justify-center space-x-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-xl transition-all text-xs active:scale-[0.98]"
                    title="Descargar archivo iCalendar (.ics) para Outlook, iPhone o Apple Calendar"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Outlook / iCal</span>
                  </button>
                </>
              )}

              {reserva.estado === 'Pendiente' && (
                <div className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span>Pendiente de aprobación</span>
                </div>
              )}

              {(reserva.estado === 'Pendiente' || reserva.estado === 'Aprobada') && (
                <button
                  onClick={() => onAbrirCancelar(reserva)}
                  className="inline-flex items-center justify-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold py-2 px-3.5 rounded-xl transition-all text-xs active:scale-[0.98]"
                  title="Cancelar esta reserva con justificación formal"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}