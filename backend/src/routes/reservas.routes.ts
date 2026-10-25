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
  crearReservaIndividual,
  listarReservasTurnoActual,
  registrarAsistenciaManual
} from '../controllers/reservas.controller';
import {
  AuthRequest,
  verificarToken,
  permitirRoles,
  esAdminOResponsable
} from '../middlewares/auth.middleware';

const router = Router();

// Middleware especifico para reservas individuales de estudiantes
const soloEstudiantes = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol !== 'Estudiante') {
    res.status(403).json({ error: 'La reserva individual está disponible únicamente para estudiantes' });
    return;
  }
  next();
};

// Registro de reserva de laboratorio (Docente, Auxiliar, Admin)
router.post('/', verificarToken, crearReserva);

// Bandeja de reservas pendientes (Responsable y Admin)
router.get('/pendientes', verificarToken, esAdminOResponsable, listarReservasPendientes);

// Historial personal y codigo QR de reservas aprobadas
router.get('/mis-reservas', verificarToken, listarMisReservas);

// Escaneo y validacion de codigo QR
router.post(
  '/escanear-qr',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  escanearQr
);

// Listar reservas del turno actual para control de asistencia presencial
router.get(
  '/turno-actual',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  listarReservasTurnoActual
);

// Registrar asistencia manual de contingencia
router.post(
  '/:id/asistencia-manual',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  registrarAsistenciaManual
);

// Gestion y aprobacion/rechazo de reservas
router.put('/:id/gestionar', verificarToken, esAdminOResponsable, gestionarReserva);

router.put(
  '/:id/aprobar',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  aprobarReserva
);

router.put(
  '/:id/rechazar',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  rechazarReserva
);

// Cancelacion de reservas
router.put('/:id/cancelar', verificarToken, cancelarReserva);

router.put(
  '/:id/cancelar-fuerza-mayor',
  verificarToken,
  esAdminOResponsable,
  cancelarReservaFuerzaMayor
);

// Obtencion de codigo QR especifico
router.get('/:id/qr', verificarToken, obtenerQrReserva);

// Reserva individual de computadora para estudiantes
router.post('/:id/reservas', verificarToken, soloEstudiantes, crearReservaIndividual);

// Consulta general de reservas del campus
router.get(
  '/',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  listarTodasLasReservas
);

export default router;
