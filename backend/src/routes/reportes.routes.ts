import { Router } from 'express';
import { reporteAsistenciasDiarias } from '../controllers/reportes.controller';
import { permitirRoles, verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// HU-24: Auditoría general de reservas disponible para Administrador y Responsable de Laboratorio
router.get(
  '/asistencias',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  reporteAsistenciasDiarias
);

export default router;
