import { Router } from 'express';
import { listarLaboratorios } from '../controllers/laboratorios.controller';

const router = Router();

router.get('/', listarLaboratorios);

export default router;
