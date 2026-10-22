import { Router, Response, NextFunction } from 'express';
import {
  crearReserva,
  listarReservasPendientes,
  gestionarReserva,
  obtenerQrReserva,
  listarMisReservas,
  obtenerMisReservas,
  escanearQr,
  aprobarReserva,
  rechazarReserva,
  cancelarReserva,
  cancelarReservaFuerzaMayor,
  listarTodasLasReservas,
  crearReservaIndividual
} from '../controllers/reservas.controller';
import {
  AuthRequest,
  verificarToken,
  permitirRoles,
  esAdminOResponsable
} from '../middlewares/auth.middleware';

const router = Router();

// Middleware específico para reservas individuales de estudiantes
const soloEstudiantes = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol !== 'Estudiante') {
    res.status(403).json({ error: 'La reserva individual está disponible únicamente para estudiantes' });
    return;
  }
  next();
};

// =========================================================================
// REGISTRO DE RESERVA DE LABORATORIO (DOCENTE, AUXILIAR, ADMIN)
// POST /api/reservas
// =========================================================================
router.post('/', verificarToken, crearReserva);

// =========================================================================
// BANDEJA DE RESERVAS PENDIENTES (RESPONSABLE Y ADMIN)
// GET /api/reservas/pendientes
// =========================================================================
router.get('/pendientes', verificarToken, esAdminOResponsable, listarReservasPendientes);

// =========================================================================
// VER CÓDIGO QR DE RESERVA APROBADA / HISTORIAL PERSONAL
// GET /api/reservas/mis-reservas
// =========================================================================
router.get('/mis-reservas', verificarToken, listarMisReservas);

// =========================================================================
// ESCANEAR CÓDIGO QR DE RESERVA
// POST /api/reservas/escanear-qr
// =========================================================================
router.post(
  '/escanear-qr',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  escanearQr
);

// =========================================================================
// APROBAR O RECHAZAR RESERVA (RESPONSABLE Y ADMIN)
// PUT /api/reservas/:id/gestionar
// =========================================================================
router.put('/:id/gestionar', verificarToken, esAdminOResponsable, gestionarReserva);

// PUT /api/reservas/:id/aprobar
router.put(
  '/:id/aprobar',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  aprobarReserva
);

// Rechazar una reserva pendiente con motivo
router.put(
  '/:id/rechazar',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  rechazarReserva
);

// Cancelar una reserva existente (Propietario o Admin)
router.put('/:id/cancelar', verificarToken, cancelarReserva);

// Cancelar una reserva por fuerza mayor con motivo obligatorio (Admin o Responsable)
router.put(
  '/:id/cancelar-fuerza-mayor',
  verificarToken,
  esAdminOResponsable,
  cancelarReservaFuerzaMayor
);

// =========================================================================
// OBTENER CÓDIGO QR ESPECÍFICO
// GET /api/reservas/:id/qr
// =========================================================================
router.get('/:id/qr', verificarToken, obtenerQrReserva);

// =========================================================================
// RESERVA INDIVIDUAL DE COMPUTADORA
// POST /api/laboratorios/:id/reservas
// =========================================================================
router.post('/:id/reservas', verificarToken, soloEstudiantes, crearReservaIndividual);

// =========================================================================
// GESTIÓN Y CONSULTA GENERAL DE RESERVAS DEL CAMPUS
// GET /api/reservas
// =========================================================================
router.get(
  '/',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  listarTodasLasReservas
);

export default router;
