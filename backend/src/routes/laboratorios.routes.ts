import { Router } from 'express';
import { 
  listarLaboratorios,
  crearLaboratorio,
  obtenerLaboratorioPorId,
  actualizarLaboratorio,
  eliminarLaboratorio
} from '../controllers/laboratorios.controller';
import { crearReservaIndividual } from '../controllers/reservas.controller';
import { verificarToken, esAdmin, soloEstudiantes } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas (Búsqueda)
router.get('/', listarLaboratorios);
router.get('/:id', obtenerLaboratorioPorId);

// Reserva individual de computadoras en un laboratorio (HU-28 - Estudiantes)
router.post('/:id/reservas', verificarToken, soloEstudiantes, crearReservaIndividual);

// Rutas protegidas (Solo Administradores)
router.post('/', verificarToken, esAdmin, crearLaboratorio);
router.put('/:id', verificarToken, esAdmin, actualizarLaboratorio);
router.delete('/:id', verificarToken, esAdmin, eliminarLaboratorio);

export default router;