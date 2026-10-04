import { Router } from 'express';
import { 
  listarLaboratorios,
  crearLaboratorio,
  obtenerLaboratorioPorId,
  actualizarLaboratorio,
  eliminarLaboratorio
} from '../controllers/laboratorios.controller';
import { verificarToken, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rutas pblicas (Bsqueda)
router.get('/', listarLaboratorios);
router.get('/:id', obtenerLaboratorioPorId);

// Rutas protegidas (Solo Administradores)
router.post('/', verificarToken, esAdmin, crearLaboratorio);
router.put('/:id', verificarToken, esAdmin, actualizarLaboratorio);
router.delete('/:id', verificarToken, esAdmin, eliminarLaboratorio);

export default router;
