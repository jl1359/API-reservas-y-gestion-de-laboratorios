import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { usuariosApi } from '../api/usuarios.api';
import { laboratoriosApi } from '../api/laboratorios.api';
import { sancionesApi } from '../api/sanciones.api';
import type { Usuario, Mantenimiento, AuditoriaEvento, Rol, Sancion } from '../types';

import TabLaboratorios, { type LaboratorioAdminItem } from '../components/admin/TabLaboratorios';
import TabUsuarios, { type SolicitudRolItem } from '../components/admin/TabUsuarios';
import TabReservas, { type ReservaPendiente } from '../components/admin/TabReservas';
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
  const [reservasPendientes, setReservasPendientes] = useState<ReservaPendiente[]>([]);
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
          axios.get('http://localhost:3000/api/reservas/pendientes', { headers }).catch(() => ({ data: { data: [] } })),
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
      setReservasPendientes(resReservas.data?.data || resReservas.data?.reservas || []);
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

  useEffect(() => {
    fetchData();
  }, []);

  const sancionesActivasCount = sancionesList.filter(
    (s) => s.estado === 'Activa' && new Date() < new Date(s.fechaFin)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-tech-blue" /> Panel de Administración
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestiona laboratorios, inventario, usuarios, régimen disciplinario y reportes institucionales.
            </p>
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('laboratorios')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'laboratorios'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Laboratorios
          </button>

          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'usuarios'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Usuarios y Roles
            {solicitudes.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'usuarios' ? 'bg-white text-tech-blue' : 'bg-rose-500 text-white'
                }`}
              >
                {solicitudes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservas')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'reservas'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Solicitudes de Reserva
            {reservasPendientes.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'reservas' ? 'bg-white text-tech-blue' : 'bg-amber-500 text-white'
                }`}
              >
                {reservasPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mantenimientos')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'mantenimientos'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Mantenimientos
            {mantenimientosList.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'mantenimientos' ? 'bg-white text-tech-blue' : 'bg-indigo-600 text-white'
                }`}
              >
                {mantenimientosList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('feriados')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'feriados'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Feriados
            {feriadosList.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'feriados' ? 'bg-white text-tech-blue' : 'bg-indigo-600 text-white'
                }`}
              >
                {feriadosList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'auditoria'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Auditoría
          </button>

          <button
            onClick={() => setActiveTab('sanciones')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'sanciones'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Sanciones
            {sancionesActivasCount > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'sanciones' ? 'bg-white text-tech-blue' : 'bg-rose-500 text-white'
                }`}
              >
                {sancionesActivasCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reportes')}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'reportes'
                ? 'bg-tech-blue text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Reportes / KPIs
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
            reservasPendientes={reservasPendientes}
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
