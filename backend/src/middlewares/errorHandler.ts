import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 1. Error operacional controlado con AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
      },
    });
    return;
  }

  // 2. Error de validación Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos proporcionados no cumplen con el formato requerido',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // 3. Errores conocidos de Prisma ORM
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `Ya existe un registro con ese valor único (${target.join(', ')})`,
          details: err.meta,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'El recurso solicitado no fue encontrado en la base de datos',
          details: err.meta,
        },
      });
      return;
    }
  }

  // 4. Errores de restricción de PostgreSQL (ej. EXCLUDE USING gist: 23P01)
  if (err.code === '23P01') {
    res.status(409).json({
      error: {
        code: 'RESERVA_SOLAPADA',
        message: 'El horario solicitado colisiona con otra reserva activa en este laboratorio',
        details: null,
      },
    });
    return;
  }

  // 5. Error no controlado (500)
  console.error('🔥 Error no manejado en servidor:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno en el servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : null,
    },
  });
};
