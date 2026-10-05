import { Router } from 'express';
import { configurarHorarios, verCalendarioLaboratorio } from '../controllers/horarios_calendario.controller';
import { verificarToken, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// HU-12: Ver calendario de un laboratorio (Protegida para que solo usuarios logueados lo vean, o pública según decidan)
router.get('/:id/calendario', verificarToken, verCalendarioLaboratorio);

// HU-06: Configurar horarios (Solo Admin)
router.post('/:id/horarios', verificarToken, esAdmin, configurarHorarios);

export default router;