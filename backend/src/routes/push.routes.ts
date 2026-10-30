import { Router } from 'express';
import {
  obtenerClavePublica,
  guardarSuscripcion,
  eliminarSuscripcion,
  enviarNotificacionPushPrueba
} from '../controllers/push.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/public-key', obtenerClavePublica);
router.post('/suscribir', verificarToken, guardarSuscripcion);
router.delete('/desuscribir', verificarToken, eliminarSuscripcion);
router.post('/probar', verificarToken, enviarNotificacionPushPrueba);

export default router;
