import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * ARCHIVO: validate.ts
 * PROPÓSITO: Middleware genérico que recibe un Schema de Zod y 
 * valida que el body, query o params de la petición HTTP coincidan con ese esquema.
 */

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Datos de entrada inválidos',
          detalles: error.issues.map((err) => ({
            campo: err.path.join('.'),
            mensaje: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Parámetros de búsqueda inválidos',
          detalles: error.issues.map((err) => ({
            parametro: err.path.join('.'),
            mensaje: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
