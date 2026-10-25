import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  FlaskConical, 
  Users, 
  CalendarCheck, 
  Wrench, 
  CalendarDays, 
  Activity, 
  AlertOctagon, 
  BarChart3 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { usuariosApi } from '../api/usuarios.api';
import { laboratoriosApi } from '../api/laboratorios.api';
import { sancionesApi } from '../api/sanciones.api';
import type { Usuario, Mantenimiento, AuditoriaEvento, Rol, Sancion } from '../types';

import TabLaboratorios, { type LaboratorioAdminItem } from '../components/admin/TabLaboratorios';
import TabUsuarios, { type SolicitudRolItem } from '../components/admin/TabUsuarios';
import TabReservas, { type ReservaItem } from '../components/admin/TabReservas';
import TabMantenimientos from '../components/admin/TabMantenimientos';
import TabFeriados from '../components/admin/TabFeriados';
import TabAuditoria from '../components/admin/TabAuditoria';
import TabSanciones from '../components/admin/TabSanciones';
import TabReportes from '../components/admin/TabReportes';

interface Carrera {
  id: number;
  nombre: string;
}

interface FeriadoItem {
  id: number;
  fecha: string;
  motivo: string;
  bloqueoActivo: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    'laboratorios' | 'usuarios' | 'reservas' | 'mantenimientos' | 'feriados' | 'auditoria' | 'sanciones' | 'reportes'
  >('laboratorios');

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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resLabs, resCarreras, resSols, resReservas, resFeriados, users, mants, audits, rolesRes, sanctions] =
        await Promise.all([
          axios.get('http://localhost:3000/api/laboratorios?incluirTodos=true'),
          axios.get('http://localhost:3000/api/carreras'),
          axios.get('http://localhost:3000/api/roles/requests', { headers }).catch(() => ({ data: [] })),
          axios.get('http://localhost:3000/api/reservas', { headers }).catch(() => ({ data: { data: [] } })),
          axios.get('http://localhost:3000/api/feriados').catch(() => ({ data: { data: [] } })),
          usuariosApi.listar().catch(() => []),
          laboratoriosApi.listarMantenimientos().catch(() => []),
          usuariosApi.obtenerAuditoriaSesiones(100).catch(() => []),
          axios.get('http://localhost:3000/api/roles?paraAdmin=true').catch(() => ({ data: [] })),
          sancionesApi.listarTodas().catch(() => [])
        ]);

      setLaboratorios(resLabs.data?.laboratorios || resLabs.data?.data || []);
      setCarreras(resCarreras.data || []);
      setSolicitudes(resSols.data || []);
      setReservasList(resReservas.data?.data || resReservas.data?.reservas || []);
      setFeriadosList(resFeriados.data?.data || []);
      setUsuariosList(users || []);
      setMantenimientosList(mants || []);
      setAuditoriaList(audits || []);
      setRolesList(rolesRes.data || []);
      setSancionesList(sanctions || []);
    } catch (error) {
      toast.error('Error al cargar datos del sistema');
    } finally {
      setIsLoading(false);
    }
  };

  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tabContainerRef.current) {
      const activeBtn = tabContainerRef.current.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const sancionesActivasCount = sancionesList.filter(
    (s) => s.estado === 'Activa' && new Date() < new Date(s.fechaFin)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] font-inter">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-tech-blue dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gestión Centralizada FCyT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center">
              Panel de Administración
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Control de laboratorios, inventario, autorizaciones de rol, régimen disciplinario y reportes institucionales.
            </p>
          </div>
        </div>

        {/* Selector de Pestaña para Móviles Pequeños */}
        <div className="block sm:hidden mb-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Sección del Panel
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-tech-blue shadow-xs cursor-pointer"
          >
            <option value="laboratorios" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Laboratorios</option>
            <option value="usuarios" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Usuarios y Roles {solicitudes.length > 0 ? `(${solicitudes.length} pendientes)` : ''}</option>
            <option value="reservas" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Reservas ({reservasList.length})</option>
            <option value="mantenimientos" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mantenimientos ({mantenimientosList.length})</option>
            <option value="feriados" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Feriados ({feriadosList.length})</option>
            <option value="auditoria" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Auditoría</option>
            <option value="sanciones" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sanciones {sancionesActivasCount > 0 ? `(${sancionesActivasCount} activas)` : ''}</option>
            <option value="reportes" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Reportes / KPIs</option>
          </select>
        </div>

        {/* Barra de Pestañas Segmentada (Horizontal Swipeable en tablets y móviles) */}
        <div 
          ref={tabContainerRef}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex space-x-1.5 overflow-x-auto no-scrollbar mb-8 shadow-sm scroll-smooth"
        >
          <button
            data-tab="laboratorios"
            onClick={() => setActiveTab('laboratorios')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'laboratorios'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <FlaskConical className="w-4 h-4 mr-2 shrink-0" />
            <span>Laboratorios</span>
          </button>

          <button
            data-tab="usuarios"
            onClick={() => setActiveTab('usuarios')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'usuarios'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 mr-2 shrink-0" />
            <span>Usuarios y Roles</span>
            {solicitudes.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'usuarios' ? 'bg-white text-tech-blue' : 'bg-rose-500 text-white'
                }`}
              >
                {solicitudes.length}
              </span>
            )}
          </button>

          <button
            data-tab="reservas"
            onClick={() => setActiveTab('reservas')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'reservas'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4 mr-2 shrink-0" />
            <span>Reservas</span>
            {reservasList.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'reservas' ? 'bg-white text-tech-blue' : 'bg-blue-500/20 text-tech-blue dark:text-blue-300'
                }`}
              >
                {reservasList.length}
              </span>
            )}
          </button>

          <button
            data-tab="mantenimientos"
            onClick={() => setActiveTab('mantenimientos')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'mantenimientos'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-4 h-4 mr-2 shrink-0" />
            <span>Mantenimientos</span>
            {mantenimientosList.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'mantenimientos' ? 'bg-white text-tech-blue' : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {mantenimientosList.length}
              </span>
            )}
          </button>

          <button
            data-tab="feriados"
            onClick={() => setActiveTab('feriados')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'feriados'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CalendarDays className="w-4 h-4 mr-2 shrink-0" />
            <span>Feriados</span>
            {feriadosList.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'feriados' ? 'bg-white text-tech-blue' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {feriadosList.length}
              </span>
            )}
          </button>

          <button
            data-tab="auditoria"
            onClick={() => setActiveTab('auditoria')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'auditoria'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 mr-2 shrink-0" />
            <span>Auditoría</span>
          </button>

          <button
            data-tab="sanciones"
            onClick={() => setActiveTab('sanciones')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'sanciones'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <AlertOctagon className="w-4 h-4 mr-2 shrink-0" />
            <span>Sanciones</span>
            {sancionesActivasCount > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'sanciones' ? 'bg-white text-tech-blue' : 'bg-rose-500 text-white'
                }`}
              >
                {sancionesActivasCount}
              </span>
            )}
          </button>

          <button
            data-tab="reportes"
            onClick={() => setActiveTab('reportes')}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all active:scale-[0.985] ${
              activeTab === 'reportes'
                ? 'bg-tech-blue text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2 shrink-0" />
            <span>Reportes</span>
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
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
    </div>
  );
}
