import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; rol: string };
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No se proporcionó un token de acceso válido' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal') as { id: number; rol: string };
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const esAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol !== 'Admin') {
    res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Administrador' });
    return;
  }
  next();
};
