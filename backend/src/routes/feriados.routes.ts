import { Router } from 'express';
import {
  listarFeriados,
  crearFeriado,
  eliminarFeriado,
  toggleFeriado
} from '../controllers/feriados.controller';
import { verificarToken, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// HU-29: Rutas de gestión de feriados y bloqueos

// 1. Listado general de feriados (abierto para consulta de usuarios, calendarios y admin)
router.get('/', listarFeriados);

// 2. Crear un nuevo feriado restrictivo (Solo Administrador)
router.post('/', verificarToken, esAdmin, crearFeriado);

// 3. Eliminar / anular un feriado permanentemente (Solo Administrador)
router.delete('/:id', verificarToken, esAdmin, eliminarFeriado);

// 4. Alternar estado activo del bloqueo (Solo Administrador)
router.patch('/:id/toggle', verificarToken, esAdmin, toggleFeriado);

export default router;
