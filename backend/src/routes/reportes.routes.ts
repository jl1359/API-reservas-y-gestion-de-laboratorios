import { Router } from 'express';
import { reporteAsistenciasDiarias } from '../controllers/reportes.controller';
import { permitirRoles, verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// HU-24: la auditoría general de reservas solo puede verla un administrador.
router.get('/asistencias', verificarToken, permitirRoles('Admin'), reporteAsistenciasDiarias);

export default router;
