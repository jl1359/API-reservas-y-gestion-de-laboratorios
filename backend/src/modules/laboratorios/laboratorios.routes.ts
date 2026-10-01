import { Router } from 'express';
import { listarLaboratorios } from './laboratorios.controller';

const router = Router();

router.get('/', listarLaboratorios);

export default router;