import { NextFunction, Response, Router } from 'express';
import { crearReservaIndividual } from '../controllers/reservas.controller';
import { AuthRequest, verificarToken } from '../middlewares/auth.middleware';

const router = Router();

const soloEstudiantes = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol !== 'Estudiante') {
    res.status(403).json({ error: 'La reserva individual está disponible únicamente para estudiantes' });
    return;
  }

  next();
};

router.post('/:id/reservas', verificarToken, soloEstudiantes, crearReservaIndividual);

export default router;
