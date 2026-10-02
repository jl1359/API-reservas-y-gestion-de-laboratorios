// RUTAS
import { Router } from 'express';
import { createLabHandler } from './labs.controller';
import { validate } from '../../../middlewares/validate';
import { createLabSchema } from './labs.schema';

const router = Router();

// POST /api/labs
router.post('/', validate(createLabSchema), createLabHandler);

export default router;