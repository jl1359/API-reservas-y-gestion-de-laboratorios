import { Router } from 'express';
import { configurarHorarios, verCalendarioLaboratorio } from '../controllers/horarios_calendario.controller';
import { verificarToken, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Ver calendario y disponibilidad de un laboratorio
router.get('/:id/calendario', verCalendarioLaboratorio);

// Configurar horarios operativos (Solo Admin)
router.post('/:id/horarios', verificarToken, esAdmin, configurarHorarios);

export default router;