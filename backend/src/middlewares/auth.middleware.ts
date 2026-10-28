import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user?: { id: number; rol: string };
}

export const verificarToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Debes iniciar sesión para continuar' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_de_respaldo') as { id: number; rol: string };
    
    // Consultar el usuario y su rol en tiempo real desde la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        activo: true,
        rol: { select: { nombre: true } }
      }
    });

    if (!usuario) {
      res.status(401).json({ error: 'Usuario no encontrado o sesión no válida' });
      return;
    }

    if (!usuario.activo) {
      res.status(403).json({ error: 'Tu cuenta ha sido desactivada o suspendida' });
      return;
    }

    req.user = {
      id: usuario.id,
      rol: usuario.rol?.nombre || decoded.rol || 'Estudiante'
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' });
  }
};

export const esAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const rol = req.user?.rol;
  if (rol !== 'Admin' && rol !== 'Administrador') {
    res.status(403).json({ error: 'Esta acción requiere permisos de Administrador' });
    return;
  }
  next();
};

export const permitirRoles = (...rolesPermitidos: string[]) => {
  const rolesNormalizados = rolesPermitidos.flatMap(r => 
    r === 'Admin' || r === 'Administrador' ? ['Admin', 'Administrador'] : [r]
  );
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !rolesNormalizados.includes(req.user.rol)) {
      res.status(403).json({
        error: `No cuentas con los permisos requeridos para esta sección.`
      });
      return;
    }
    next();
  };
};

export const esAdminOResponsable = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const rol = req.user?.rol;
  if (rol !== 'Admin' && rol !== 'Administrador' && rol !== 'Responsable de Laboratorio') {
    res.status(403).json({ error: 'Esta acción requiere permisos de Administrador o Responsable de Laboratorio' });
    return;
  }
  next();
};

export const soloEstudiantes = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol !== 'Estudiante') {
    res.status(403).json({ error: 'La reserva individual está disponible únicamente para estudiantes' });
    return;
  }
  next();
};