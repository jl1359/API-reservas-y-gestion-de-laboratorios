import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUser {
  id: number;
  rol: string;
  nombre?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No se proporcionó un token de acceso válido (Bearer Token requerido)',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED_OR_INVALID',
        message: 'Token de acceso inválido o expirado',
      },
    });
  }
};

export const autorizar = (...rolesPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado',
        },
      });
      return;
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Acceso denegado: se requiere uno de los siguientes roles [${rolesPermitidos.join(', ')}]`,
        },
      });
      return;
    }

    next();
  };
};

export const esAdmin = autorizar('Admin');
