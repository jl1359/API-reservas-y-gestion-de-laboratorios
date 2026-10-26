import { Router } from 'express';
import {
  listarEquipamientosBase,
  vincularEquipamiento,
  crearEquipamiento,
  actualizarCantidadEquipamiento,
  desvincularEquipamiento
} from '../controllers/equipamiento.controller';
import { verificarToken, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Catálogo base de equipamientos
router.get('/', verificarToken, listarEquipamientosBase);

// Alta de nuevo tipo de equipamiento (HU-33)
router.post('/', verificarToken, esAdmin, crearEquipamiento);

// Vincular equipamiento con cantidad a un laboratorio
router.post('/laboratorio/:id', verificarToken, esAdmin, vincularEquipamiento);

// Actualizar cantidad de equipamiento asignado a un laboratorio
router.put('/laboratorio/:labId/:equipId', verificarToken, esAdmin, actualizarCantidadEquipamiento);

// Desvincular / eliminar equipamiento de un laboratorio
router.delete('/laboratorio/:labId/:equipId', verificarToken, esAdmin, desvincularEquipamiento);

export default router;