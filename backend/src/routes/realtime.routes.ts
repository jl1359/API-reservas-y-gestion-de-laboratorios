import { Router, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { AuthRequest, esAdmin, verificarToken } from '../middlewares/auth.middleware';
import {
  obtenerEstadisticasRealtime,
  suscribirClienteRealtime,
} from '../services/realtime.service';

const router = Router();

const autenticarStreamSse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const tokenQuery = typeof req.query.token === 'string' ? req.query.token : '';
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : tokenQuery;

    if (!token) {
      res.status(401).json({ error: 'Token requerido para conexión en tiempo real' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secreto_de_respaldo'
    ) as { id: number; rol: string };

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        activo: true,
        rol: { select: { nombre: true } },
      },
    });

    if (!usuario || !usuario.activo) {
      res.status(401).json({ error: 'Sesión no válida o cuenta inactiva' });
      return;
    }

    req.user = {
      id: usuario.id,
      rol: usuario.rol?.nombre || decoded.rol || 'Estudiante',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token expirado o inválido' });
  }
};

// Stream Server-Sent Events (SSE) para actualizaciones en tiempo real
router.get('/stream', autenticarStreamSse, suscribirClienteRealtime);

// Métrica rápida de clientes conectados en tiempo real (Solo Admin)
router.get('/stats', verificarToken, esAdmin, (_req, res: Response) => {
  res.json({ success: true, ...obtenerEstadisticasRealtime() });
});

export default router;
