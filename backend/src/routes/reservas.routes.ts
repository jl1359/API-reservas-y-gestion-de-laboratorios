import { Router } from 'express';
import {
  obtenerQrReserva,
  listarMisReservas,
  escanearQr,
  aprobarReserva,
  listarTodasLasReservas
} from '../controllers/reservas.controller';
import { verificarToken, permitirRoles } from '../middlewares/auth.middleware';

const router = Router();

// =========================================================================
// HU-22: VER CÓDIGO QR DE RESERVA APROBADA
// =========================================================================
// Consultar mis reservas personales (incluye tokenQr únicamente si la reserva está Aprobada)
router.get('/mis-reservas', verificarToken, listarMisReservas);

// Consultar o generar el código QR de una reserva aprobada específica
router.get('/:id/qr', verificarToken, obtenerQrReserva);

// =========================================================================
// HU-23: ESCANEAR CÓDIGO QR DE RESERVA
// =========================================================================
// Escaneo y validación de QR: Exclusivo para personal autorizado (Admin, Responsable, Auxiliar)
router.post(
  '/escanear-qr',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  escanearQr
);

// =========================================================================
// RUTAS DE GESTIÓN ADMINISTRATIVA
// =========================================================================
// Aprobar una reserva y expedir su código QR criptográfico
router.put(
  '/:id/aprobar',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  aprobarReserva
);

// Listar todas las reservas del sistema (con filtros)
router.get(
  '/',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'),
  listarTodasLasReservas
);

export default router;
