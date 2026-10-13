import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Sun, Moon, Menu, X, Shield } from 'lucide-react';
import LogoIcon from './LogoIcon';

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-transparent dark:border-slate-800 px-4 sm:px-8 py-4 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo y Título */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3">
            <LogoIcon className="w-8 h-8 sm:w-9 sm:h-9 text-umss-blue dark:text-blue-400" />
            <div className="hidden sm:block">
              <h1 className="font-poppins font-bold text-umss-blue dark:text-white leading-tight text-sm">Universidad Mayor de San Simón</h1>
              <p className="text-slate-500 dark:text-slate-300 text-[10px] sm:text-xs">Facultad de Ciencias y Tecnología</p>
            </div>
            <div className="ml-2 sm:ml-4 px-2 sm:px-3 py-1 bg-tech-blue text-white text-[10px] sm:text-xs font-bold rounded-lg shadow-sm">
              LabReserve
            </div>
          </Link>
        </div>

        {/* Desktop Menu */}
        {isAuthenticated && (
          <div className="hidden md:flex space-x-6 lg:space-x-8 items-center flex-1 justify-center">
            <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-blue-400 font-medium transition-colors">Inicio</Link>
            <Link to="/perfil" className="text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-blue-400 font-medium transition-colors">Mi Perfil</Link>
            {userRole === 'Admin' && (
              <Link to="/admin" className="text-tech-blue dark:text-blue-400 font-bold flex items-center">
                <Shield className="w-4 h-4 mr-1" /> Panel Admin
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
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium">Inicio</Link>
          <Link to="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium">Mi Perfil</Link>
          {userRole === 'Admin' && (
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-tech-blue dark:text-blue-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">Panel Admin</Link>
          )}
          <button onClick={handleLogout} className="w-full text-left mt-4 px-4 py-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold">Cerrar Sesión</button>
        </div>
      )}
    </nav>
  );
}