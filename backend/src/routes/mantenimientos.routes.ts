import { Router } from 'express';
import {
  cambiarEstadoOperativo,
  registrarMantenimiento,
  listarMantenimientos,
  eliminarMantenimiento
} from '../controllers/mantenimientos.controller';
import {
  verificarToken,
  esAdminOResponsable
} from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  cambiarEstadoOperativoSchema,
  registrarMantenimientoSchema
} from '../validators/laboratorio.validator';

const router = Router();

// HU-11: Listar mantenimientos (público o autenticado)
router.get('/', listarMantenimientos);

// HU-11: Registrar reporte de mantenimiento (Admin o Responsable)
router.post(
  '/',
  verificarToken,
  esAdminOResponsable,
  validate(registrarMantenimientoSchema),
  registrarMantenimiento
);

// HU-11: Eliminar o finalizar mantenimiento (Admin o Responsable)
router.delete('/:id', verificarToken, esAdminOResponsable, eliminarMantenimiento);

// HU-10: Cambiar estado operativo rápido de laboratorio (Admin o Responsable)
router.patch(
  '/laboratorios/:id/estado-operativo',
  verificarToken,
  esAdminOResponsable,
  validate(cambiarEstadoOperativoSchema),
  cambiarEstadoOperativo
);

export default router;
