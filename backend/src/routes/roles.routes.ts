import { Router } from 'express';
import { solicitarRol, listarSolicitudes, gestionarSolicitud } from '../controllers/roles.controller';
import { verificarToken, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// HU-27: Rutas para solicitudes de rol
// Cualquier usuario logueado puede pedir un rol
router.post('/request', verificarToken, solicitarRol);

// Solo los Administradores pueden ver y aprobar
router.get('/requests', verificarToken, esAdmin, listarSolicitudes);
router.put('/manage/:id', verificarToken, esAdmin, gestionarSolicitud);

export default router;
