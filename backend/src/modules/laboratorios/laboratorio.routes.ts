import { Router } from 'express';
import { laboratorioController } from './laboratorio.controller';
import { validateQuery } from '../../middlewares/validate';
import { ListarLaboratoriosQuerySchema, CalendarioQuerySchema } from './laboratorio.schema';

const router = Router();

/**
 * @route   GET /api/laboratorios
 * @desc    Listar laboratorios (con filtros de capacidad, estado, nombre) para seleccionar
 */
router.get('/', validateQuery(ListarLaboratoriosQuerySchema), (req, res) => {
  laboratorioController.listar(req, res);
});

/**
 * @route   GET /api/laboratorios/:id
 * @desc    Obtener detalles generales, horarios y equipamiento de un laboratorio
 */
router.get('/:id', (req, res) => {
  laboratorioController.obtenerPorId(req, res);
});

/**
 * @route   GET /api/laboratorios/:id/calendario
 * @desc    Seleccionar un laboratorio para ver su calendario (horarios, reservas, mantenimientos)
 * @query   desde (ISO DateTime), hasta (ISO DateTime)
 */
router.get('/:id/calendario', validateQuery(CalendarioQuerySchema), (req, res) => {
  laboratorioController.obtenerCalendario(req, res);
});

export default router;
