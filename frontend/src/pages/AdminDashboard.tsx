import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FlaskConical, 
  Users, 
  CalendarCheck, 
  Wrench, 
  CalendarDays, 
  Activity, 
  AlertOctagon, 
  BarChart3,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { usuariosApi } from '../api/usuarios.api';
import { laboratoriosApi } from '../api/laboratorios.api';
import { sancionesApi } from '../api/sanciones.api';
import { carrerasApi } from '../api/carreras.api';
import { rolesApi } from '../api/roles.api';
import { reservasApi } from '../api/reservas.api';
import { feriadosApi } from '../api/feriados.api';
import { mantenimientosApi } from '../api/mantenimientos.api';
import type { Usuario, Mantenimiento, AuditoriaEvento, Rol, Sancion, Carrera, Feriado as FeriadoItem } from '../types';

import TabLaboratorios, { type LaboratorioAdminItem } from '../components/admin/TabLaboratorios';
import TabUsuarios, { type SolicitudRolItem } from '../components/admin/TabUsuarios';
import TabReservas, { type ReservaItem } from '../components/admin/TabReservas';
import TabMantenimientos from '../components/admin/TabMantenimientos';
import TabFeriados from '../components/admin/TabFeriados';
import TabAuditoria from '../components/admin/TabAuditoria';
import TabSanciones from '../components/admin/TabSanciones';
import TabReportes from '../components/admin/TabReportes';
import AnimatedCounter from '../components/common/AnimatedCounter';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['laboratorios', 'usuarios', 'reservas', 'mantenimientos', 'feriados', 'auditoria', 'sanciones', 'reportes'] as const;
  type AdminTab = (typeof validTabs)[number];

  const getInitialTab = (): AdminTab => {
    const tabUrl = searchParams.get('tab') as AdminTab;
    if (tabUrl && validTabs.includes(tabUrl)) return tabUrl;
    const tabStorage = localStorage.getItem('admin_active_tab') as AdminTab;
    if (tabStorage && validTabs.includes(tabStorage)) return tabStorage;
    return 'laboratorios';
  };

  const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialTab);

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
    localStorage.setItem('admin_active_tab', tab);
  };

  const [laboratorios, setLaboratorios] = useState<LaboratorioAdminItem[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRolItem[]>([]);
  const [reservasList, setReservasList] = useState<ReservaItem[]>([]);
  const [feriadosList, setFeriadosList] = useState<FeriadoItem[]>([]);
  const [usuariosList, setUsuariosList] = useState<Usuario[]>([]);
  const [rolesList, setRolesList] = useState<Rol[]>([]);
  const [mantenimientosList, setMantenimientosList] = useState<Mantenimiento[]>([]);
  const [auditoriaList, setAuditoriaList] = useState<AuditoriaEvento[]>([]);
  const [sancionesList, setSancionesList] = useState<Sancion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ribbonOffsetDias, setRibbonOffsetDias] = useState(0);
  const [selectedRibbonDate, setSelectedRibbonDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const fetchData = async (silencioso = false) => {
    try {
      if (!silencioso) setIsLoading(true);

      const [labs, carrs, sols, reservas, feriados, users, mants, audits, roles, sanctions] =
        await Promise.all([
          laboratoriosApi.listar({ incluirTodos: true }).catch(() => []),
          carrerasApi.listar().catch(() => []),
          rolesApi.listarSolicitudes().catch(() => []),
          reservasApi.listarTodas().catch(() => []),
          feriadosApi.listar().catch(() => []),
          usuariosApi.listar().catch(() => []),
          mantenimientosApi.listar().catch(() => []),
          usuariosApi.obtenerAuditoriaSesiones(100).catch(() => []),
          rolesApi.listar(true).catch(() => []),
          sancionesApi.listarTodas().catch(() => [])
        ]);

      setLaboratorios(labs as any);
      setCarreras(carrs);
      setSolicitudes(sols as any);
      setReservasList(reservas as any);
      setFeriadosList(feriados);
      setUsuariosList(users);
      setMantenimientosList(mants);
      setAuditoriaList(audits);
      setRolesList(roles);
      setSancionesList(sanctions);
    } catch (error) {
      if (!silencioso) toast.error('Error al cargar datos del sistema');
    } finally {
      if (!silencioso) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData().then(() => toast.success('Datos actualizados'));
  };

  // Canal persistente en tiempo real mediante Server-Sent Events (SSE)
  const { conectado: realtimeConectado } = useRealtimeEvents({
    onEvento: (evento, payload) => {
      fetchData(true);
      if (evento === 'reserva_creada') {
        const idTexto = payload.id ? ` #${payload.id}` : '';
        toast.success(`Nueva reserva registrada${idTexto}`, { duration: 3000 });
      } else if (evento === 'asistencia_registrada') {
        toast.success('Ingreso validado mediante código QR', { duration: 2500 });
      } else if (evento === 'sancion_actualizada') {
        toast('Actualización en estado de suspensiones', { duration: 3000 });
      } else if (evento === 'laboratorio_actualizado') {
        toast('Estado operativo de laboratorio actualizado', { duration: 2500 });
      }
    }
  });

  // Respaldo de sincronización periódica pasiva (5 min en tiempo real, 60s si desconectado)
  useEffect(() => {
    let ultimaActualizacion = Date.now();
    fetchData();

    const frecuencia = realtimeConectado ? 300000 : 60000;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        ultimaActualizacion = Date.now();
        fetchData(true);
      }
    }, frecuencia);

    const onFocus = () => {
      if (Date.now() - ultimaActualizacion >= 30000) {
        ultimaActualizacion = Date.now();
        fetchData(true);
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [realtimeConectado]);

  const sancionesActivasCount = sancionesList.filter(
    (s) => s.estado === 'Activa' && new Date() < new Date(s.fechaFin)
  ).length;

  const toLocalDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const obtenerEventosPorFecha = (dateKey: string) => {
    const [anio, mes, dia] = dateKey.split('-').map(Number);
    const dayStart = new Date(anio, mes - 1, dia, 0, 0, 0, 0);
    const dayEnd = new Date(anio, mes - 1, dia, 23, 59, 59, 999);

    const reservasDia = reservasList.filter((r) => {
      if (r.estado === 'Rechazada' || r.estado === 'Cancelada') return false;
      return toLocalDateKey(new Date(r.fechaInicio)) === dateKey;
    });

    const mantenimientosDia = mantenimientosList.filter((m) => {
      const inicio = new Date(m.fechaInicio);
      const fin = new Date(m.fechaFin);
      return inicio <= dayEnd && fin >= dayStart;
    });

    const feriadoDia = feriadosList.find(
      (f) => f.bloqueoActivo && f.fecha.slice(0, 10) === dateKey
    );

    return { reservasDia, mantenimientosDia, feriadoDia };
  };

  // Cinta horizontal de la semana en el panel administrativo
  const fechaBase = new Date();
  fechaBase.setDate(fechaBase.getDate() + ribbonOffsetDias);
  const nombreMes = fechaBase.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const mesesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  const hoy = new Date();
  const hoyKey = toLocalDateKey(hoy);
  const diasRibbon = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date(fechaBase);
    d.setDate(fechaBase.getDate() + offset);
    const key = toLocalDateKey(d);
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const { reservasDia, mantenimientosDia, feriadoDia } = obtenerEventosPorFecha(key);
    return {
      key,
      nombre: nombres[d.getDay()],
      numero: d.getDate(),
      esHoy: key === hoyKey,
      reservasCount: reservasDia.length,
      tieneMantenimiento: mantenimientosDia.length > 0,
      esFeriado: Boolean(feriadoDia)
    };
  });

  const selectedDayInfo = obtenerEventosPorFecha(selectedRibbonDate);
  const [selYear, selMonth, selDay] = selectedRibbonDate.split('-').map(Number);
  const selectedDateObj = new Date(selYear, selMonth - 1, selDay);
  const selectedDateLabelRaw = selectedDateObj.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const selectedDateLabel =
    selectedDateLabelRaw.charAt(0).toUpperCase() + selectedDateLabelRaw.slice(1);

  const feriadoHoy = feriadosList.find(
    (f) => f.bloqueoActivo && f.fecha.slice(0, 10) === hoyKey
  );
  const minutosActuales = hoy.getHours() * 60 + hoy.getMinutes();
  const esDomingo = hoy.getDay() === 0;
  const enHorarioOperativo = minutosActuales >= 6 * 60 + 45 && minutosActuales <= 21 * 60 + 45;

  const estadoTurnoActual = feriadoHoy
    ? {
        abierto: false,
        texto: `Feriado (${feriadoHoy.motivo})`,
        dotClass: 'bg-indigo-500',
        textClass: 'text-indigo-600 dark:text-indigo-400'
      }
    : esDomingo
      ? {
          abierto: false,
          texto: 'Domingo (Sin atención regular)',
          dotClass: 'bg-slate-400',
          textClass: 'text-slate-500 dark:text-slate-400'
        }
      : enHorarioOperativo
        ? {
            abierto: true,
            texto: 'Jornada Abierta (06:45 - 21:45)',
            dotClass: 'bg-emerald-500 animate-pulse',
            textClass: 'text-emerald-600 dark:text-emerald-400'
          }
        : {
            abierto: false,
            texto: 'Fuera de Horario (06:45 - 21:45)',
            dotClass: 'bg-amber-500',
            textClass: 'text-amber-600 dark:text-amber-400'
          };

  // Configuración de los 8 módulos del Dock Flotante
  const dockModules = [
    {
      id: 'laboratorios' as const,
      label: 'Laboratorios',
      icon: FlaskConical,
      count: laboratorios.length,
      badgeColor: 'bg-blue-500'
    },
    {
      id: 'usuarios' as const,
      label: 'Usuarios y Roles',
      icon: Users,
      count: usuariosList.length,
      alertCount: solicitudes.length,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'reservas' as const,
      label: 'Reservas del Campus',
      icon: CalendarCheck,
      count: reservasList.length,
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'mantenimientos' as const,
      label: 'Mantenimientos',
      icon: Wrench,
      count: mantenimientosList.length,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'feriados' as const,
      label: 'Feriados Académicos',
      icon: CalendarDays,
      count: feriadosList.length,
      badgeColor: 'bg-indigo-500'
    },
    {
      id: 'auditoria' as const,
      label: 'Auditoría y Sesiones',
      icon: Activity,
      count: null,
      badgeColor: ''
    },
    {
      id: 'sanciones' as const,
      label: 'Sanciones',
      icon: AlertOctagon,
      count: sancionesActivasCount,
      alertCount: sancionesActivasCount,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'reportes' as const,
      label: 'Métricas y Analítica',
      icon: BarChart3,
      count: null,
      badgeColor: ''
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f8] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-inter transition-colors duration-300">
      <Navbar />

      {/* Contenedor Maestro Dashboard V18: Dock Izquierdo + Lienzo Bento */}
      <div className="max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-5 items-start">
        
        {/* ========================================================
            DOCK FLOTANTE CÁPSULA NEGRA (V18 LEFT FLOATING CAPSULE DOCK)
            ======================================================== */}
        <aside className="w-full lg:w-20 lg:sticky lg:top-6 shrink-0 z-40">
          <div className="bg-[#121316] dark:bg-[#0d1017] p-2.5 sm:p-3 rounded-[32px] border border-white/10 shadow-2xl flex lg:flex-col items-center justify-between lg:justify-start gap-2 sm:gap-3 overflow-x-auto lg:overflow-x-visible no-scrollbar">
            
            {/* Logo de la Cápsula V18 (Glyph estilizado de dos barras inclinadas //) */}
            <div className="hidden lg:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D2E38] to-[#181920] border border-white/10 items-center justify-center text-white shadow-inner mb-3">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-5 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-full transform -skew-x-12" />
                <span className="w-1.5 h-5 bg-gradient-to-b from-indigo-400 to-blue-500 rounded-full transform -skew-x-12" />
              </div>
            </div>

            {/* Lista Vertical de Píldoras / Iconos V18 */}
            <nav className="flex lg:flex-col items-center gap-2 w-full">
              {dockModules.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <div key={item.id} className="relative group flex items-center justify-center w-full">
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 ease-out cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-[#EDE8FD] text-[#5538EE] dark:bg-[#5538EE] dark:text-white shadow-xl shadow-purple-500/25 font-bold scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />

                      {/* Badge / Indicador de Notificación o Alerta */}
                      {item.alertCount !== undefined && item.alertCount > 0 ? (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-[#121316] animate-pulse" />
                      ) : item.count !== null && item.count > 0 && !isActive ? (
                        <span className="hidden lg:block absolute -top-0.5 -right-0.5 text-[9px] font-black px-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {item.count > 99 ? '99+' : item.count}
                        </span>
                      ) : null}
                    </button>

                    {/* Indicador de pestaña activa en el borde del Dock (Estilo V18) */}
                    {isActive && (
                      <span className="hidden lg:block absolute -right-3 w-1.5 h-5 bg-[#EDE8FD] dark:bg-[#5538EE] rounded-l-full shadow-sm" />
                    )}

                    {/* Tooltip Flotante Extendido a la Derecha (Estilo V18) */}
                    <div className="hidden lg:block absolute left-16 px-3 py-1.5 bg-[#1a1b20] text-white text-xs font-bold rounded-xl shadow-2xl border border-white/10 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 transform -translate-x-2 group-hover:translate-x-0">
                      <div className="flex items-center space-x-1.5">
                        <span>{item.label}</span>
                        {item.count !== null && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-white/15 text-slate-200">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Separador y Botón de Recarga / Estado */}
            <div className="hidden lg:flex flex-col items-center pt-3 mt-2 border-t border-white/10 w-full">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing || isLoading}
                title="Sincronizar telemetría de base de datos"
                className="w-11 h-11 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 text-tech-blue ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================
            LIENZO PRINCIPAL BENTO (V18 MAIN WORKSPACE)
            ======================================================== */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          
          {/* Fila Superior Bento: Banner Hero + Mini Calendario V18 Ribbon */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">
            
            {/* 1. Hero Card Pastel Lavanda V18 */}
            <div className="xl:col-span-2 relative overflow-hidden rounded-[32px] p-6 sm:p-8 bg-gradient-to-r from-[#EDE8FD] via-[#F4EFFF] to-[#E5EDFD] dark:from-[#171828] dark:via-[#1c1a32] dark:to-[#161a29] border border-purple-200/60 dark:border-purple-500/20 shadow-sm flex flex-col justify-between">
              {/* Esfera / Arte 3D decorativa abstracta estilo Dashboard V18 */}
              <div className="absolute top-2 right-4 w-44 h-44 sm:w-56 sm:h-56 pointer-events-none opacity-85 select-none hidden sm:block">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="70" fill="url(#grad1)" opacity="0.8" />
                  <ellipse cx="100" cy="100" rx="85" ry="35" transform="rotate(-25 100 100)" stroke="url(#grad2)" strokeWidth="8" opacity="0.75" />
                  <ellipse cx="100" cy="100" rx="85" ry="35" transform="rotate(35 100 100)" stroke="url(#grad3)" strokeWidth="6" opacity="0.6" />
                  <circle cx="100" cy="100" r="28" fill="#5034EA" opacity="0.25" />
                  <defs>
                    <radialGradient id="grad1" cx="0.3" cy="0.3" r="0.7">
                      <stop offset="0%" stopColor="#D8B4FE" />
                      <stop offset="50%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#7E22CE" />
                    </radialGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="200" y2="200">
                      <stop offset="0%" stopColor="#E9D5FF" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                    <linearGradient id="grad3" x1="200" y1="0" x2="0" y2="200">
                      <stop offset="0%" stopColor="#93C5FD" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-purple-200/50 dark:border-purple-500/20 text-[#5034EA] dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#5034EA] dark:text-purple-400" />
                  <span>Infraestructura Académica FCyT · Panel Admin</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Gestión Inteligente de Laboratorios
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-lg leading-relaxed">
                  Supervisión centralizada de aulas especializadas, control de reservas por computadora y auditoría de asistencia en tiempo real.
                </p>
              </div>

              {/* Botonera de Acción en el Hero estilo V18 */}
              <div className="relative z-10 flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-purple-200/40 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('laboratorios')}
                  className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-bold bg-[#121316] text-white hover:bg-black transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-purple-300" />
                  <span>Explorar {laboratorios.length} Laboratorios</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reportes')}
                  className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 hover:bg-white border border-slate-200 dark:border-slate-700 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-tech-blue" />
                  <span>Ver Métricas de Uso</span>
                </button>
              </div>
            </div>

            {/* 2. Mini-Calendario Horizontal Ribbon */}
            <div className="bg-white dark:bg-[#0e1320] rounded-[32px] p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-[#5034EA]" />
                    <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base">
                      {mesesCapitalizado}
                    </h3>
                  </div>

                  {/* Controles < Hoy > para navegar la semana */}
                  <div className="flex items-center space-x-1">
                    {(ribbonOffsetDias !== 0 || selectedRibbonDate !== hoyKey) && (
                      <button
                        type="button"
                        onClick={() => {
                          setRibbonOffsetDias(0);
                          setSelectedRibbonDate(hoyKey);
                        }}
                        className="px-2 py-0.5 mr-1 text-[11px] font-bold rounded-full bg-[#5034EA]/10 text-[#5034EA] dark:text-indigo-300 hover:bg-[#5034EA]/20 transition-colors cursor-pointer"
                      >
                        Hoy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const nextOffset = ribbonOffsetDias - 7;
                        const target = new Date();
                        target.setDate(target.getDate() + nextOffset);
                        setRibbonOffsetDias(nextOffset);
                        setSelectedRibbonDate(toLocalDateKey(target));
                      }}
                      aria-label="Semana anterior"
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextOffset = ribbonOffsetDias + 7;
                        const target = new Date();
                        target.setDate(target.getDate() + nextOffset);
                        setRibbonOffsetDias(nextOffset);
                        setSelectedRibbonDate(toLocalDateKey(target));
                      }}
                      aria-label="Semana siguiente"
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cinta Horizontal de Días */}
                <div className="grid grid-cols-7 gap-1.5 py-2 text-center">
                  {diasRibbon.map((d) => {
                    const isSelected = d.key === selectedRibbonDate;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setSelectedRibbonDate(d.key)}
                        className={`p-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#121316] text-white dark:bg-white dark:text-slate-950 font-black shadow-lg scale-105'
                            : d.esHoy
                              ? 'bg-[#5034EA]/10 text-[#5034EA] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5034EA]/30 font-bold'
                              : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                          {d.nombre}
                        </span>
                        <span className="text-sm font-extrabold font-poppins">
                          {d.numero}
                        </span>
                        <span className="h-1.5 mt-1 flex items-center gap-0.5">
                          {d.esFeriado && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-300 dark:bg-indigo-600' : 'bg-indigo-500'}`}
                              title="Feriado académico"
                            />
                          )}
                          {d.reservasCount > 0 && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-emerald-500'}`}
                              title={`${d.reservasCount} reserva(s)`}
                            />
                          )}
                          {d.tieneMantenimiento && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300 dark:bg-amber-600' : 'bg-amber-500'}`}
                              title="Mantenimiento programado"
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Resumen Real del Día Seleccionado */}
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {selectedDateLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {selectedRibbonDate === hoyKey ? 'Agenda de hoy' : 'Agenda seleccionada'}
                    </span>
                  </div>

                  {selectedDayInfo.feriadoDia && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('feriados')}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center justify-between hover:bg-indigo-500/15 transition-colors cursor-pointer"
                    >
                      <span className="truncate">Feriado: {selectedDayInfo.feriadoDia.motivo}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('reservas')}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#0e1320] border border-slate-200/70 dark:border-slate-800 text-left hover:border-emerald-400/60 transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Reservas
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedDayInfo.reservasDia.length}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('mantenimientos')}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#0e1320] border border-slate-200/70 dark:border-slate-800 text-left hover:border-amber-400/60 transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Mantenimiento
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedDayInfo.mantenimientosDia.length}
                      </div>
                    </button>
                  </div>

                  {selectedDayInfo.reservasDia.length > 0 ? (
                    (() => {
                      const primera = [...selectedDayInfo.reservasDia].sort(
                        (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
                      )[0];
                      return (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Primer turno: {primera.laboratorio?.nombre || 'Laboratorio'} ·{' '}
                          {new Date(primera.fechaInicio).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      );
                    })()
                  ) : !selectedDayInfo.feriadoDia && selectedDayInfo.mantenimientosDia.length === 0 ? (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Sin turnos ni bloqueos registrados para esta fecha.
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Estado de Operatividad en el Calendario */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">Turno Actual:</span>
                <span className={`font-bold flex items-center truncate ${estadoTurnoActual.textClass}`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 shrink-0 ${estadoTurnoActual.dotClass}`} />
                  <span className="truncate">{estadoTurnoActual.texto}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Fila 2 Bento: 4 Quick Cards de Monitoreo Interactivas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Quick Card 1: Laboratorios */}
            <div
              onClick={() => setActiveTab('laboratorios')}
              className={`p-5 rounded-[28px] border transition-all duration-300 cursor-pointer v18-hover-lift ${
                activeTab === 'laboratorios'
                  ? 'bg-white dark:bg-[#101728] border-tech-blue/50 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-[#0e1320] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Espacios FCyT
                </span>
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-tech-blue dark:text-blue-400">
                  <FlaskConical className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-poppins text-slate-900 dark:text-white">
                <AnimatedCounter value={laboratorios.length} duration={1100} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                <span>{laboratorios.length} Laboratorios verificados</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </p>
            </div>

            {/* Quick Card 2: Reservas */}
            <div
              onClick={() => setActiveTab('reservas')}
              className={`p-5 rounded-[28px] border transition-all duration-300 cursor-pointer v18-hover-lift ${
                activeTab === 'reservas'
                  ? 'bg-white dark:bg-[#101728] border-tech-blue/50 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-[#0e1320] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Reservas
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-poppins text-slate-900 dark:text-white">
                <AnimatedCounter value={reservasList.length} duration={1100} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                <span>Turnos programados</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </p>
            </div>

            {/* Quick Card 3: Comunidad */}
            <div
              onClick={() => setActiveTab('usuarios')}
              className={`p-5 rounded-[28px] border transition-all duration-300 cursor-pointer v18-hover-lift ${
                activeTab === 'usuarios'
                  ? 'bg-white dark:bg-[#101728] border-tech-blue/50 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-[#0e1320] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Comunidad
                </span>
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black font-poppins text-slate-900 dark:text-white">
                  <AnimatedCounter value={usuariosList.length} duration={1100} />
                </span>
                {solicitudes.length > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                    +{solicitudes.length} roles
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                <span>Docentes y estudiantes</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </p>
            </div>

            {/* Quick Card 4: Sanciones */}
            <div
              onClick={() => setActiveTab('sanciones')}
              className={`p-5 rounded-[28px] border transition-all duration-300 cursor-pointer v18-hover-lift ${
                activeTab === 'sanciones'
                  ? 'bg-white dark:bg-[#101728] border-tech-blue/50 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-[#0e1320] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Sanciones
                </span>
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-poppins text-slate-900 dark:text-white">
                <AnimatedCounter value={sancionesActivasCount} duration={900} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                <span>{sancionesActivasCount > 0 ? 'Bloqueos 24h activos' : 'Sin penalizaciones'}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </p>
            </div>
          </div>

          {/* Fila 3: Contenido Dinámico de la Pestaña Activa (Animado con v18-tab-enter) */}
          <div key={activeTab} className="v18-tab-enter">
            {activeTab === 'laboratorios' && (
              <TabLaboratorios
                laboratorios={laboratorios}
                carreras={carreras}
                isLoading={isLoading}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'usuarios' && (
              <TabUsuarios
                usuariosList={usuariosList}
                rolesList={rolesList}
                solicitudes={solicitudes}
                isLoading={isLoading}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'reservas' && (
              <TabReservas
                reservasList={reservasList}
                isLoading={isLoading}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'mantenimientos' && (
              <TabMantenimientos
                mantenimientosList={mantenimientosList}
                laboratorios={laboratorios}
                isLoading={isLoading}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'feriados' && (
              <TabFeriados
                feriadosList={feriadosList}
                isLoading={isLoading}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'auditoria' && (
              <TabAuditoria
                auditoriaList={auditoriaList}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'sanciones' && (
              <TabSanciones
                sancionesList={sancionesList}
                usuariosList={usuariosList}
                isLoading={isLoading}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'reportes' && (
              <TabReportes
                laboratorios={laboratorios}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
