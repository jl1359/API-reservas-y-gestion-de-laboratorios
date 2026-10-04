import { Router } from 'express';
import {
  crearControladorLab, obtenerControladorLabs, obtenerControladorLabPorId,
  actualizarControladorLab, eliminarControladorLab,
} from './labs.controller';
import { validate } from '../../../middlewares/validate';
import { crearEsquemaLab, actualizarEsquemaLab } from './labs.schema';

const router = Router();

router.post('/', validate(crearEsquemaLab), crearControladorLab);
router.get('/', obtenerControladorLabs);
router.get('/:id', obtenerControladorLabPorId);
router.put('/:id', validate(actualizarEsquemaLab), actualizarControladorLab);
router.delete('/:id', eliminarControladorLab);

export default router;