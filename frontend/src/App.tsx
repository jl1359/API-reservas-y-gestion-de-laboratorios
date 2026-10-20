import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import LabDetail from './pages/LabDetail';
import AdminDashboard from './pages/AdminDashboard';
import Perfil from './pages/Perfil';
import EscanearQr from './pages/EscanearQr';
import ReporteAsistencias from './pages/ReporteAsistencias';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'Admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Ruta protegida para personal de control de acceso físico
const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const rolesAutorizados = ['Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'];
  if (!role || !rolesAutorizados.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Ruta protegida para auditoría y reportes diarios de asistencia
const ReportesRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const rolesAutorizados = ['Admin', 'Responsable de Laboratorio'];
  if (!role || !rolesAutorizados.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verificar-correo/:token" element={<VerifyEmail />} />
        
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/laboratorio/:id" element={<ProtectedRoute><LabDetail /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        
        {/* Ruta para escaneo de código QR */}
        <Route path="/escanear-qr" element={<StaffRoute><EscanearQr /></StaffRoute>} />

        {/* Ruta para reporte diario de asistencias */}
        <Route path="/reportes" element={<ReportesRoute><ReporteAsistencias /></ReportesRoute>} />
        <Route path="/reporte-asistencias" element={<ReportesRoute><ReporteAsistencias /></ReportesRoute>} />

        {/* Ruta protegida estrictamente para Administradores */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </Router>
  );
}

export default App;