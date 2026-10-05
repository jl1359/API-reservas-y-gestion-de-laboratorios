import { Router } from 'express';
import { listarEquipamientosBase, vincularEquipamiento } from '../controllers/equipamiento.controller';
import { verificarToken, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Públicas o Protegidas generales
router.get('/', verificarToken, listarEquipamientosBase);

// Protegidas (Solo Admin)
router.post('/laboratorio/:id', verificarToken, esAdmin, vincularEquipamiento);

export default router;