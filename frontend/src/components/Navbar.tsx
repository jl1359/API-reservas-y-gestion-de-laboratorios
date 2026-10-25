import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Sun, Moon, Menu, X, Shield, QrCode, FileText, Bell, CheckCheck } from 'lucide-react';
import axios from 'axios';

import LogoIcon from './LogoIcon';

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('userRole') || '');
  const puedeEscanear = ['Admin', 'Administrador', 'Responsable de Laboratorio', 'Auxiliar de Docencia'].includes(userRole);
  const puedeVerReportes = ['Admin', 'Administrador', 'Responsable de Laboratorio'].includes(userRole);
  
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados de Notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Sincronizar rol real desde el backend
  useEffect(() => {
    if (!isAuthenticated) return;
    const syncUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('http://localhost:3000/api/usuarios/perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success && res.data?.data) {
          const perfil = res.data.data;
          const rolNombre = typeof perfil.rol === 'object' && perfil.rol !== null
            ? (perfil.rol.nombre || 'Estudiante')
            : (perfil.rol || 'Estudiante');
          if (rolNombre && rolNombre !== userRole) {
            localStorage.setItem('userRole', rolNombre);
            setUserRole(rolNombre);
          }
        }
      } catch (e) {
        // Silencioso si la sesión expira
      }
    };
    syncUserRole();
  }, [isAuthenticated, userRole]);


  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
    window.location.reload();
  };

  // Consultar notificaciones en tiempo real
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotificaciones = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/notificaciones', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setNotificaciones(res.data.notificaciones || []);
          setNoLeidas(res.data.noLeidas || 0);
        }
      } catch (e) {
        // Silencioso si la sesión expira
      }
    };

    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 15000); // Polling cada 15s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarcarTodasLeidas = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3000/api/notificaciones/marcar-todas', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNoLeidas(0);
      setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    } catch (e) {}
  };

  const handleMarcarLeida = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/notificaciones/${id}/leida`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.leido) {
      await handleMarcarLeida(notif.id);
    }
    setIsNotifOpen(false);

    const msg = (notif.mensaje || '').toLowerCase();

    // Redirigir al módulo según el contexto
    if (msg.includes('sanción') || msg.includes('sancion') || msg.includes('suspendid')) {
      navigate('/perfil');
    } else if (msg.includes('reserva') || msg.includes('código qr') || msg.includes('codigo qr') || msg.includes('cancelada')) {
      navigate('/perfil');
    } else if (msg.includes('rol') || msg.includes('permisos')) {
      navigate('/perfil');
    } else if (msg.includes('mantenimiento')) {
      navigate('/');
    } else if (['Admin', 'Administrador', 'Responsable de Laboratorio'].includes(userRole)) {
      navigate('/admin');
    } else {
      navigate('/perfil');
    }
  };

  return (
    <nav className="bg-white/85 dark:bg-[#090d16]/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 sticky top-0 z-50 transition-all duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo y Título */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex flex-col items-center justify-center shrink-0">
              <LogoIcon className="w-8 h-8 text-umss-blue dark:text-blue-400 transition-transform group-hover:scale-105" />
              <span className="text-[10px] font-extrabold text-tech-blue dark:text-blue-400 tracking-tight font-poppins mt-0.5 leading-none">
                LabReserve
              </span>
            </div>
            <div className="hidden sm:block border-l border-slate-200 dark:border-slate-700 pl-3">
              <h1 className="font-poppins font-bold text-umss-blue dark:text-white leading-tight text-sm">Universidad Mayor de San Simón</h1>
              <p className="text-slate-500 dark:text-slate-300 text-[10px] sm:text-xs">Facultad de Ciencias y Tecnología</p>
            </div>
          </Link>
        </div>

        {/* Desktop Menu */}
        {isAuthenticated && (
          <div className="hidden md:flex space-x-6 lg:space-x-8 items-center flex-1 justify-center">
            <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-blue-400 font-medium transition-colors">
              Inicio
            </Link>
            <Link to="/perfil" className="text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-blue-400 font-medium transition-colors">
              Mi Perfil
            </Link>
            
            {/* Acceso directo a Escanear QR para personal autorizado */}
            {puedeEscanear && (
              <Link 
                to="/escanear-qr" 
                className="text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-blue-400 font-semibold flex items-center space-x-1 transition-colors"
              >
                <QrCode className="w-4 h-4 text-tech-blue" />
                <span>Escanear QR</span>
              </Link>
            )}

            {/* Acceso a Reportes de Asistencias */}
            {puedeVerReportes && (
              <Link 
                to="/reportes" 
                className="text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-blue-400 font-semibold flex items-center space-x-1 transition-colors"
              >
                <FileText className="w-4 h-4 text-tech-blue" />
                <span>Reportes</span>
              </Link>
            )}

            {(userRole === 'Admin' || userRole === 'Administrador') && (
              <Link to="/admin" className="text-tech-blue dark:text-blue-400 font-bold flex items-center">
                <Shield className="w-4 h-4 mr-1" /> Panel Administrador
              </Link>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Alternar Modo Oscuro"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Campana de Notificaciones */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {noLeidas > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {/* Menú Flotante de Notificaciones */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-tech-blue" /> Notificaciones
                      {noLeidas > 0 && (
                        <span className="text-xs font-normal text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                          {noLeidas} nuevas
                        </span>
                      )}
                    </h3>
                    {noLeidas > 0 && (
                      <button
                        onClick={handleMarcarTodasLeidas}
                        className="text-xs text-tech-blue hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Marcar leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notificaciones.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        No tienes notificaciones
                      </div>
                    ) : (
                      notificaciones.map((notif: any) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 text-xs cursor-pointer transition-all group ${
                            !notif.leido 
                              ? 'bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/50' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] text-slate-400">
                              {notif.fechaCreacion ? new Date(notif.fechaCreacion).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {!notif.leido && (
                                <span className="w-2 h-2 rounded-full bg-tech-blue shrink-0" />
                              )}
                              <span className="text-[10px] font-semibold text-tech-blue dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver módulo →
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                            {notif.mensaje}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="hidden md:block">
              <button onClick={handleLogout} className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all shadow-sm text-sm sm:text-base">
                <LogOut className="w-4 h-4 hidden sm:block" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 bg-umss-blue hover:bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all shadow-md text-sm sm:text-base">
              <User className="w-4 h-4 hidden sm:block" />
              <span>Entrar</span>
            </Link>
          )}

          {/* Botón menú móvil */}
          {isAuthenticated && (
            <button 
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {isMobileMenuOpen && isAuthenticated && (
        <div className="md:hidden pt-4 pb-2 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium">
            Inicio
          </Link>
          <Link to="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium">
            Mi Perfil
          </Link>
          {puedeEscanear && (
            <Link to="/escanear-qr" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-tech-blue dark:text-blue-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span>Escanear QR</span>
            </Link>
          )}
          {puedeVerReportes && (
            <Link to="/reportes" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-tech-blue dark:text-blue-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Reportes de Asistencias</span>
            </Link>
          )}
          {(userRole === 'Admin' || userRole === 'Administrador') && (
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-tech-blue dark:text-blue-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
              Panel Administrador
            </Link>
          )}
          <button onClick={handleLogout} className="w-full text-left mt-4 px-4 py-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold">
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}