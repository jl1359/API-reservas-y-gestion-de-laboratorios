import { Router } from 'express';
import { getCarreras } from '../controllers/carrera.controller';

const router = Router();

router.get('/', getCarreras);

export default router;