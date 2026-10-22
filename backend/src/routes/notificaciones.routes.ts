import { Router } from 'express';
import {
  listarMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasComoLeidas
} from '../controllers/notificaciones.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// Consultar mis notificaciones y el número de no leídas
router.get('/', verificarToken, listarMisNotificaciones);

// Marcar todas como leídas
router.put('/marcar-todas', verificarToken, marcarTodasComoLeidas);

// Marcar una notificación individual como leída
router.put('/:id/leida', verificarToken, marcarNotificacionLeida);

export default router;
