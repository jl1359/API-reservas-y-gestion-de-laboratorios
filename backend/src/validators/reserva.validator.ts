import { z } from 'zod';

export const cancelarFuerzaMayorSchema = z.object({
  motivo: z.string().min(5, 'El motivo de fuerza mayor debe tener al menos 5 caracteres')
});

export const cancelarReservaPropiaSchema = z.object({
  motivo: z.string().optional()
});
