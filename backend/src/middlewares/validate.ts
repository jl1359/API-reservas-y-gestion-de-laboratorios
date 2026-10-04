import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error: any) {
      // Imprimimos el error completo en la terminal para ver exactamente qué falló
      console.error("ERROR REAL ATRAPADO:", error); 
      
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors || error.message || error,
      });
    }
  };
};