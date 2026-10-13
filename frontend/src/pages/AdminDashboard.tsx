import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, ShieldCheck, X, Box, Server, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

interface Carrera { id: number; nombre: string; }
interface Laboratorio {
  id: number; nombre: string; capacidad: number; ubicacion: string | null;
  estadoOperativo: string; reservaPorComputadora: boolean; carreraId: number | null;
  imagenUrl?: string | null;
}
interface EquipamientoBase { id: number; nombre: string; tipo: string; }
interface LabEquipo { cantidad: number; equipamiento: EquipamientoBase; }
interface Solicitud {
  id: number; rolSolicitado: string; motivo: string; estado: string; createdAt: string;
  usuario: { nombreCompleto: string; correo: string; rol: { nombre: string } };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'laboratorios' | 'solicitudes'>('laboratorios');
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // AÑADIDO: estadoOperativo e imagenUrl
  const [formData, setFormData] = useState({ 
    nombre: '', 
    capacidad: '', 
    ubicacion: '', 
    carreraId: '', 
    reservaPorComputadora: false,
    estadoOperativo: 'Activo',
    imagenUrl: ''
  });

  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [selectedLabName, setSelectedLabName] = useState('');
  const [equiposBase, setEquiposBase] = useState<EquipamientoBase[]>([]);
  const [currentLabEquipos, setCurrentLabEquipos] = useState<LabEquipo[]>([]);
  const [equipForm, setEquipForm] = useState({ equipamientoId: '', cantidad: '1' });
  const [isEquipLoading, setIsEquipLoading] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const defaultSchedule = [
    { dia: 'Lunes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Martes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Miércoles', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Jueves', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Viernes', activo: true, horaApertura: '08:00', horaCierre: '18:00' },
    { dia: 'Sábado', activo: false, horaApertura: '08:00', horaCierre: '12:00' },
    { dia: 'Domingo', activo: false, horaApertura: '08:00', horaCierre: '12:00' },
  ];
  const [scheduleForm, setScheduleForm] = useState(defaultSchedule);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const resLabs = await axios.get('http://localhost:3000/api/laboratorios?incluirTodos=true');
      setLaboratorios(resLabs.data.laboratorios || []);
      
      const resCarreras = await axios.get('http://localhost:3000/api/carreras');
      setCarreras(resCarreras.data);

      const resSols = await axios.get('http://localhost:3000/api/roles/requests', { headers });
      setSolicitudes(resSols.data || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenCreate = () => { 
    setModalMode('crear'); 
    setEditingId(null); 
    setFormData({ nombre: '', capacidad: '', ubicacion: '', carreraId: '', reservaPorComputadora: false, estadoOperativo: 'Activo', imagenUrl: '' }); 
    setIsModalOpen(true); 
  };

  const handleOpenEdit = (lab: Laboratorio) => { 
    setModalMode('editar'); 
    setEditingId(lab.id); 
    setFormData({ 
      nombre: lab.nombre, 
      capacidad: lab.capacidad.toString(), 
      ubicacion: lab.ubicacion || '', 
      carreraId: lab.carreraId ? lab.carreraId.toString() : '', 
      reservaPorComputadora: lab.reservaPorComputadora,
      estadoOperativo: lab.estadoOperativo || 'Activo',
      imagenUrl: lab.imagenUrl || ''
    }); 
    setIsModalOpen(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // AÑADIDO: enviar estadoOperativo e imagenUrl
      const payload = { 
        nombre: formData.nombre, 
        capacidad: Number(formData.capacidad), 
        ubicacion: formData.ubicacion, 
        carreraId: formData.carreraId ? Number(formData.carreraId) : null, 
        reservaPorComputadora: formData.reservaPorComputadora,
        estadoOperativo: formData.estadoOperativo,
        imagenUrl: formData.imagenUrl || undefined
      };
      
      if (modalMode === 'crear') { 
        await axios.post('http://localhost:3000/api/laboratorios', payload, { headers: { Authorization: `Bearer ${token}` } }); 
        toast.success('Laboratorio creado'); 
      } else { 
        await axios.put(`http://localhost:3000/api/laboratorios/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } }); 
        toast.success('Laboratorio actualizado'); 
      }
      setIsModalOpen(false); 
      fetchData();
    } catch (error: any) { 
      toast.error(error.response?.data?.error || `Error al ${modalMode} laboratorio`); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de dar de baja este laboratorio?')) return;
    try { 
      await axios.delete(`http://localhost:3000/api/laboratorios/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      toast.success('Laboratorio eliminado'); 
      fetchData(); 
    } catch (error: any) { 
      toast.error('Error al eliminar'); 
    }
  };

  const handleOpenEquip = async (lab: Laboratorio) => { setSelectedLabId(lab.id); setSelectedLabName(lab.nombre); setIsEquipModalOpen(true); setEquipForm({ equipamientoId: '', cantidad: '1' }); await loadEquipData(lab.id); };
  const loadEquipData = async (labId: number) => {
    try { 
      setIsEquipLoading(true); 
      const token = localStorage.getItem('token');
      const resBase = await axios.get('http://localhost:3000/api/equipamientos', { headers: { Authorization: `Bearer ${token}` } }); setEquiposBase(resBase.data);
      const resLab = await axios.get(`http://localhost:3000/api/laboratorios/${labId}`, { headers: { Authorization: `Bearer ${token}` } }); setCurrentLabEquipos(resLab.data.data.equipos || []);
    } catch (error) { toast.error('Error al cargar equipamiento'); } finally { setIsEquipLoading(false); }
  };
  const handleAddEquip = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedLabId) return;
    try { 
      await axios.post(`http://localhost:3000/api/equipamientos/laboratorio/${selectedLabId}`, { equipamientoId: Number(equipForm.equipamientoId), cantidad: Number(equipForm.cantidad) }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      toast.success('Equipamiento vinculado'); 
      setEquipForm({ equipamientoId: '', cantidad: '1' }); 
      await loadEquipData(selectedLabId); 
    } catch (error: any) { toast.error(error.response?.data?.error || 'Error al vincular equipamiento'); }
  };

  const handleOpenSchedule = (lab: Laboratorio) => { setSelectedLabId(lab.id); setSelectedLabName(lab.nombre); setScheduleForm([...defaultSchedule]); setIsScheduleModalOpen(true); };
  const handleToggleDay = (index: number) => { const newSchedule = [...scheduleForm]; newSchedule[index].activo = !newSchedule[index].activo; setScheduleForm(newSchedule); };
  const handleChangeTime = (index: number, field: 'horaApertura' | 'horaCierre', value: string) => { const newSchedule = [...scheduleForm]; newSchedule[index][field] = value; setScheduleForm(newSchedule); };
  const handleSaveSchedule = async () => {
    if (!selectedLabId) return;
    const payload = scheduleForm.filter(d => d.activo).map(d => ({ dia: d.dia, horaApertura: d.horaApertura, horaCierre: d.horaCierre }));
    if (payload.length === 0) return toast.error('Debes habilitar al menos un día');
    try { 
      await axios.post(`http://localhost:3000/api/laboratorios/${selectedLabId}/horarios`, { horarios: payload }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      toast.success('Horarios configurados exitosamente'); 
      setIsScheduleModalOpen(false); 
    } catch (error: any) { toast.error(error.response?.data?.error || 'Error al guardar horarios'); }
  };

  const handleGestionarSolicitud = async (id: number, accion: 'Aprobar' | 'Rechazar') => {
    if (!window.confirm(`¿Estás seguro de ${accion.toLowerCase()} esta solicitud?`)) return;
    try {
      await axios.put(`http://localhost:3000/api/roles/manage/${id}`, { accion }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success(`Solicitud ${accion.toLowerCase()}da correctamente`);
      fetchData();
    } catch (error: any) {
      toast.error('Error al gestionar solicitud');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-tech-blue" /> Panel de Administración
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona laboratorios, inventario y solicitudes de usuarios.</p>
          </div>
          <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setActiveTab('laboratorios')} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'laboratorios' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Laboratorios</button>
            <button onClick={() => setActiveTab('solicitudes')} className={`flex items-center px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'solicitudes' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              Solicitudes
              {solicitudes.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'solicitudes' ? 'bg-white text-tech-blue' : 'bg-rose-500 text-white'}`}>{solicitudes.length}</span>}
            </button>
          </div>
        </div>

        {activeTab === 'laboratorios' && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4"><button onClick={handleOpenCreate} className="bg-tech-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-sm transition-all"><Plus className="w-5 h-5 mr-2" /> Nuevo Laboratorio</button></div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
                    <tr><th className="px-6 py-4 font-bold">Laboratorio</th><th className="px-6 py-4 font-bold">Capacidad</th><th className="px-6 py-4 font-bold">Modalidad</th><th className="px-6 py-4 font-bold">Estado</th><th className="px-6 py-4 font-bold text-right">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {isLoading ? (<tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>) 
                    : laboratorios.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay laboratorios registrados</td></tr>) 
                    : (laboratorios.map(lab => (
                        <tr key={lab.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{lab.nombre}<div className="text-xs font-normal text-slate-500 mt-1">{lab.ubicacion}</div></td>
                          <td className="px-6 py-4">{lab.capacidad} Asientos</td>
                          <td className="px-6 py-4">{lab.reservaPorComputadora ? 'Por PC' : 'Lab. Completo'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${lab.estadoOperativo === 'En Mantenimiento' ? 'bg-amber-100 text-amber-700' : lab.estadoOperativo === 'Inactivo' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {lab.estadoOperativo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleOpenSchedule(lab)} title="Horarios" className="p-2 text-slate-400 hover:text-indigo-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Clock className="w-4 h-4" /></button>
                            <button onClick={() => handleOpenEquip(lab)} title="Equipamiento" className="p-2 text-slate-400 hover:text-amber-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Box className="w-4 h-4" /></button>
                            <button onClick={() => handleOpenEdit(lab)} title="Editar" className="p-2 text-slate-400 hover:text-tech-blue transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(lab.id)} title="Eliminar" className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'solicitudes' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 uppercase font-poppins border-b border-slate-200 dark:border-slate-700">
                  <tr><th className="px-6 py-4 font-bold">Usuario</th><th className="px-6 py-4 font-bold">Rol Actual</th><th className="px-6 py-4 font-bold">Solicita</th><th className="px-6 py-4 font-bold">Motivo</th><th className="px-6 py-4 font-bold text-right">Decisión</th></tr>
                </thead>
                <tbody>
                  {isLoading ? (<tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue mx-auto"></div></td></tr>) 
                  : solicitudes.length === 0 ? (<tr><td colSpan={5} className="px-6 py-16 text-center"><Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-500 font-medium">No hay solicitudes pendientes.</p></td></tr>) 
                  : (solicitudes.map(sol => (
                      <tr key={sol.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4"><p className="font-bold text-slate-900 dark:text-white">{sol.usuario.nombreCompleto}</p><p className="text-xs text-slate-500">{sol.usuario.correo}</p></td>
                        <td className="px-6 py-4"><span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">{(sol.usuario.rol as any)?.nombre || 'Estudiante'}</span></td>
                        <td className="px-6 py-4 font-bold text-tech-blue dark:text-blue-400">{sol.rolSolicitado}</td>
                        <td className="px-6 py-4 max-w-xs truncate" title={sol.motivo}>{sol.motivo}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleGestionarSolicitud(sol.id, 'Aprobar')} title="Aprobar" className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"><CheckCircle className="w-5 h-5" /></button>
                          <button onClick={() => handleGestionarSolicitud(sol.id, 'Rechazar')} title="Rechazar" className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"><XCircle className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">{modalMode === 'crear' ? 'Nuevo Laboratorio' : 'Editar Laboratorio'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="labForm" onSubmit={handleSubmit} className="space-y-5">
                <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Laboratorio</label><input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Capacidad Total</label><input type="number" min="1" required value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" /></div>
                  <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Carrera Propietaria</label><select required value={formData.carreraId} onChange={e => setFormData({...formData, carreraId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"><option value="" disabled>Seleccionar...</option>{carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                </div>
                <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ubicación / Aula</label><input type="text" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" /></div>
                
                {/* NUEVOS CAMPOS: Estado e Imagen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado Operativo</label>
                    <select value={formData.estadoOperativo} onChange={e => setFormData({...formData, estadoOperativo: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none">
                      <option value="Activo">Activo</option>
                      <option value="En Mantenimiento">En Mantenimiento</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">URL de Imagen (Opcional)</label>
                    <input type="text" value={formData.imagenUrl} onChange={e => setFormData({...formData, imagenUrl: e.target.value})} placeholder="https://ejemplo.com/img.jpg" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none" />
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input type="checkbox" id="reservaMode" checked={formData.reservaPorComputadora} onChange={e => setFormData({...formData, reservaPorComputadora: e.target.checked})} className="w-5 h-5 text-tech-blue rounded border-gray-300 focus:ring-tech-blue" />
                  <label htmlFor="reservaMode" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">¿Las reservas son individuales por computadora? <br/><span className="text-xs text-slate-500 font-normal">Si se desmarca, se reserva la sala completa.</span></label>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/80">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button type="submit" form="labForm" className="px-6 py-2.5 rounded-xl font-bold bg-umss-blue hover:bg-blue-800 text-white shadow-md transition-colors">{modalMode === 'crear' ? 'Guardar' : 'Actualizar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Omitidos los otros modales (Schedule y Equip) para brevedad del regex, asumiendo que estaban igual que en mi script anterior y funcionando. ¡Espera, los escribo rápido para no romper la app entera! */}
      {isEquipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div><h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center"><Server className="w-5 h-5 mr-2 text-tech-blue" /> Equipamiento</h2><p className="text-sm text-slate-500 dark:text-slate-400">Gestionando: {selectedLabName}</p></div>
              <button onClick={() => setIsEquipModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isEquipLoading ? (
                <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Añadir Equipo</h3>
                    <form onSubmit={handleAddEquip} className="space-y-4">
                      <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catálogo</label><select required value={equipForm.equipamientoId} onChange={e => setEquipForm({...equipForm, equipamientoId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"><option value="" disabled>Seleccione un equipo...</option>{equiposBase.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.tipo})</option>)}</select></div>
                      <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cantidad</label><input type="number" min="1" required value={equipForm.cantidad} onChange={e => setEquipForm({...equipForm, cantidad: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none" /></div>
                      <button type="submit" className="w-full bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-colors">Vincular Equipo</button>
                    </form>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Inventario Actual</h3>
                    {currentLabEquipos.length > 0 ? (
                      <ul className="space-y-3">{currentLabEquipos.map((eq, i) => (<li key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700"><div><p className="font-bold text-sm text-slate-900 dark:text-white">{eq.equipamiento.nombre}</p><p className="text-xs text-slate-500">{eq.equipamiento.tipo}</p></div><span className="bg-umss-blue text-white px-2 py-1 rounded-lg text-xs font-bold">x{eq.cantidad}</span></li>))}</ul>
                    ) : (<p className="text-sm text-slate-500 italic">No hay equipos asignados.</p>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div><h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white flex items-center"><Clock className="w-5 h-5 mr-2 text-indigo-500" /> Horarios de Apertura</h2><p className="text-sm text-slate-500 dark:text-slate-400">Laboratorio: {selectedLabName}</p></div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Activa los días que el laboratorio estará abierto y define su franja horaria.</p>
              {scheduleForm.map((diaInfo, index) => (
                <div key={diaInfo.dia} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${diaInfo.activo ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'}`}>
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0"><input type="checkbox" checked={diaInfo.activo} onChange={() => handleToggleDay(index)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer" /><span className={`font-bold ${diaInfo.activo ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>{diaInfo.dia}</span></div>
                  <div className="flex items-center space-x-2"><input type="time" disabled={!diaInfo.activo} value={diaInfo.horaApertura} onChange={(e) => handleChangeTime(index, 'horaApertura', e.target.value)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500"/><span className="text-slate-400">-</span><input type="time" disabled={!diaInfo.activo} value={diaInfo.horaCierre} onChange={(e) => handleChangeTime(index, 'horaCierre', e.target.value)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 outline-none focus:border-indigo-500"/></div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/80">
              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button type="button" onClick={handleSaveSchedule} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}