import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Building2, Calendar, QrCode, ClipboardList, Shield, LogOut, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rol = user?.rol || 'Estudiante';
  const esDocenteOAux = rol === 'Docente' || rol === 'Auxiliar de Docencia' || rol === 'Admin';
  const esAuxiliarOResp = rol === 'Auxiliar de Docencia' || rol === 'Responsable de Laboratorio' || rol === 'Admin';
  const esRespOAdmin = rol === 'Responsable de Laboratorio' || rol === 'Admin';
  const esAdmin = rol === 'Admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center">
            <Link to="/catalogo" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 leading-tight block">Campus Labs</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">UMSS · TELEMÁTICOS</span>
              </div>
            </Link>

            {/* Links Escritorio */}
            <nav className="hidden md:ml-8 md:flex md:space-x-4">
              <Link
                to="/catalogo"
                className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition"
              >
                <Building2 className="w-4 h-4" />
                Catálogo
              </Link>

              {isAuthenticated && esDocenteOAux && (
                <Link
                  to="/mis-reservas"
                  className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <Calendar className="w-4 h-4" />
                  Mis Reservas
                </Link>
              )}

              {isAuthenticated && esAuxiliarOResp && (
                <Link
                  to="/escanear-qr"
                  className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <QrCode className="w-4 h-4" />
                  Escanear QR
                </Link>
              )}

              {isAuthenticated && esRespOAdmin && (
                <Link
                  to="/gestion/reservas"
                  className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <ClipboardList className="w-4 h-4" />
                  Bandeja Gestión
                </Link>
              )}

              {isAuthenticated && esAdmin && (
                <Link
                  to="/admin"
                  className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <Shield className="w-4 h-4" />
                  Administración
                </Link>
              )}
            </nav>
          </div>

          {/* Sección Usuario / Acciones */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">{user.nombreCompleto}</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.rol}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Catálogo
          </Link>
          {isAuthenticated && esDocenteOAux && (
            <Link
              to="/mis-reservas"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Mis Reservas
            </Link>
          )}
          {isAuthenticated && esAuxiliarOResp && (
            <Link
              to="/escanear-qr"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Escanear QR
            </Link>
          )}
          {isAuthenticated && esRespOAdmin && (
            <Link
              to="/gestion/reservas"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Bandeja Gestión
            </Link>
          )}
          {isAuthenticated && esAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Administración
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 text-sm font-semibold text-slate-800">{user.nombreCompleto} ({user.rol})</div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
