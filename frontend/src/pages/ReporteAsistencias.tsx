import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Monitor, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  RefreshCw, 
  Printer, 
  ArrowLeft, 
  FileText,
  ShieldCheck,
  Building2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface UsuarioReserva {
  id: number;
  nombreCompleto: string;
  correo: string;
}

interface LaboratorioReserva {
  id: number;
  nombre: string;
  ubicacion: string | null;
}

interface ReservaReporte {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  horaAsistencia: string | null;
  numeroComputadora: number | null;
  usuario: UsuarioReserva;
  laboratorio: LaboratorioReserva;
}

interface ResumenReporte {
  totalReservas: number;
  asistenciasRegistradas: number;
  inasistenciasRegistradas: number;
  porEstado: Record<string, number>;
}

interface ReporteData {
  fecha: string;
  zonaHoraria: string;
  criterio: string;
  laboratorioId: number | null;
  resumen: ResumenReporte;
  reservas: ReservaReporte[];
}

interface LaboratorioOpcion {
  id: number;
  nombre: string;
}

export default function ReporteAsistencias() {
  // Inicializar con la fecha de hoy en formato local AAAA-MM-DD
  const hoyStr = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState<string>(hoyStr);
  const [laboratorioId, setLaboratorioId] = useState<string>('');
  const [laboratorios, setLaboratorios] = useState<LaboratorioOpcion[]>([]);
  
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Cargar lista de laboratorios para el filtro desplegable
  useEffect(() => {
    const fetchLaboratorios = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/laboratorios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setLaboratorios(res.data.data.map((l: any) => ({ id: l.id, nombre: l.nombre })));
        }
      } catch (err) {
        console.error('Error al cargar catálogo de laboratorios:', err);
      }
    };
    fetchLaboratorios();
  }, []);

  // Consultar reporte de asistencias
  const consultarReporte = useCallback(async (mostrarFeedback = false) => {
    if (!fecha) {
      toast.error('Selecciona una fecha válida');
      return;
    }

    try {
      if (mostrarFeedback) setIsRefreshing(true);
      else setIsLoading(true);

      const token = localStorage.getItem('token');
      const params: Record<string, string> = { fecha };
      if (laboratorioId) {
        params.laboratorioId = laboratorioId;
      }

      const res = await axios.get('http://localhost:3000/api/reportes/asistencias', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setReporte(res.data);
      if (mostrarFeedback) {
        toast.success('Reporte de asistencias actualizado');
      }
    } catch (err: any) {
      console.error('Error al consultar reporte:', err);
      const msg = err.response?.data?.error || 'No se pudo obtener el reporte de asistencias';
      toast.error(msg);
      setReporte(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fecha, laboratorioId]);

  useEffect(() => {
    consultarReporte();
  }, [consultarReporte]);

  // Formateador de horas (HH:mm)
  const formatearHora = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  // Formateador de fecha/hora completa de asistencia
  const formatearHoraExacta = (isoDate: string | null) => {
    if (!isoDate) return null;
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoDate;
    }
  };

  // Badge para estados de reserva
  const renderBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'Asistió':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Asistió
          </span>
        );
      case 'Aprobada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            Aprobada
          </span>
        );
      case 'Ausente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            {estado}
          </span>
        );
    }
  };

  const total = reporte?.resumen?.totalReservas || 0;
  const asistencias = reporte?.resumen?.asistenciasRegistradas || 0;
  const ausencias = reporte?.resumen?.inasistenciasRegistradas || 0;
  const porcentajeAsistencia = total > 0 ? Math.round((asistencias / total) * 100) : 0;

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
                  Auditoría y Reporte Diario de Asistencias
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Control de asistencia por código QR y monitoreo de ocupación de espacios (HU-24)
                </p>
              </div>
            </div>
          </div>

          {/* Acciones de exportación e impresión */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              type="button"
              className="inline-flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm text-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Reporte</span>
            </button>
            <button
              onClick={() => consultarReporte(true)}
              disabled={isRefreshing || isLoading}
              type="button"
              className="inline-flex items-center space-x-2 bg-tech-blue hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 transition-colors">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold mb-4 text-sm">
            <Filter className="w-4 h-4 text-tech-blue" />
            <span>Filtros de Auditoría</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Selector de Fecha */}
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Selector de Laboratorio */}
            <div>
              <label htmlFor="lab-reporte" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Laboratorio Específico
              </label>
              <div className="relative">
                <select
                  id="lab-reporte"
                  value={laboratorioId}
                  onChange={(e) => setLaboratorioId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/30 focus:border-tech-blue transition-all"
                >
                  <option value="">Todos los Laboratorios</option>
                  {laboratorios.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.nombre}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Información de Zona Horaria */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <div className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="truncate">
                  Zona horaria: <strong>Bolivia (America/La_Paz, UTC-04:00)</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tarjetas de Estadísticas (KPIs) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Tarjeta: Total Reservas */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reservas del Día
              </p>
              <p className="text-2xl sm:text-3xl font-poppins font-bold text-slate-900 dark:text-white mt-1">
                {isLoading ? '--' : total}
              </p>
              <span className="text-[11px] text-slate-400">Programadas para la fecha</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-tech-blue dark:text-blue-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Tarjeta: Asistencias Confirmadas por QR */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Asistencias (QR)
              </p>
              <p className="text-2xl sm:text-3xl font-poppins font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {isLoading ? '--' : asistencias}
              </p>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                {porcentajeAsistencia}% de cumplimiento
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Tarjeta: Inasistencias Registradas */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Inasistencias
              </p>
              <p className="text-2xl sm:text-3xl font-poppins font-bold text-rose-700 dark:text-rose-300 mt-1">
                {isLoading ? '--' : ausencias}
              </p>
              <span className="text-[11px] text-rose-500/80">Usuarios no presentados</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Tarjeta: Distribución por Estado */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center transition-colors">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Desglose de Estados
            </p>
            {isLoading ? (
              <p className="text-xs text-slate-400">Cargando métricas...</p>
            ) : reporte?.resumen?.porEstado && Object.keys(reporte.resumen.porEstado).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(reporte.resumen.porEstado).map(([estado, cant]) => (
                  <span
                    key={estado}
                    className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                  >
                    <strong>{cant}</strong>&nbsp;{estado}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin registros para el filtro</p>
            )}
          </div>
        </section>

        {/* Tabla Detallada de Reservas */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <h2 className="font-poppins font-bold text-slate-900 dark:text-white text-lg">
              Detalle de Asistencias por Reserva
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total listado: <strong>{reporte?.reservas?.length || 0}</strong>
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-blue"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generando reporte de auditoría...</p>
            </div>
          ) : !reporte?.reservas || reporte.reservas.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                No se encontraron reservas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No hay actividades registradas para la fecha seleccionada ({fecha})
                {laboratorioId ? ' en este laboratorio' : ''}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Horario Programado</th>
                    <th scope="col" className="px-5 py-3.5">Laboratorio</th>
                    <th scope="col" className="px-5 py-3.5">Usuario Titular</th>
                    <th scope="col" className="px-5 py-3.5">Modalidad</th>
                    <th scope="col" className="px-5 py-3.5">Estado</th>
                    <th scope="col" className="px-5 py-3.5">Ingreso / Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {reporte.reservas.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                      
                      {/* Horario */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-medium text-slate-800 dark:text-white">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{formatearHora(r.fechaInicio)} - {formatearHora(r.fechaFin)}</span>
                        </div>
                      </td>

                      {/* Laboratorio */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {r.laboratorio?.nombre || 'Laboratorio N/A'}
                        </div>
                        {r.laboratorio?.ubicacion && (
                          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                            <span>{r.laboratorio.ubicacion}</span>
                          </div>
                        )}
                      </td>

                      {/* Usuario */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {r.usuario?.nombreCompleto || 'Usuario'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {r.usuario?.correo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Modalidad */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.numeroComputadora ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-tech-blue dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Monitor className="w-3.5 h-3.5 mr-1" />
                            PC #{r.numeroComputadora}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 mr-1" />
                            Lab. Completo
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderBadgeEstado(r.estado)}
                      </td>

                      {/* Sello de Asistencia */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.horaAsistencia ? (
                          <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Confirmada a las {formatearHoraExacta(r.horaAsistencia)}</span>
                          </div>
                        ) : r.estado === 'Ausente' ? (
                          <div className="text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center space-x-1">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span>Inasistencia registrada</span>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Sin escaneo de QR</span>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
