import { Router } from 'express';
import {
  crearReserva,
  listarReservasPendientes,
  gestionarReserva,
  obtenerMisReservas
} from '../controllers/reservas.controller';
import { verificarToken, esAdminOResponsable } from '../middlewares/auth.middleware';

const router = Router();

// HU-15: Solicitud de Reserva (Docentes, Auxiliares, Admins)
router.post('/', verificarToken, crearReserva);

// HU-16: Bandeja de Reservas Pendientes (Solo Responsables y Admin)
router.get('/pendientes', verificarToken, esAdminOResponsable, listarReservasPendientes);

// HU-17: Aprobar o Rechazar Reserva (Solo Responsables y Admin)
router.put('/:id/gestionar', verificarToken, esAdminOResponsable, gestionarReserva);

// Historial personal de reservas
router.get('/mis-reservas', verificarToken, obtenerMisReservas);

export default router;
