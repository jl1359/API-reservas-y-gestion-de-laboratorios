import { z } from 'zod';

export const crearSancionManualSchema = z.object({
  usuarioId: z.number().int().positive('El ID de usuario debe ser un número entero positivo'),
  horasDuracion: z.number().int().min(1, 'La duración mínima es de 1 hora').max(720, 'La duración máxima permitida es de 720 horas (30 días)'),
  motivo: z.string().trim().min(5, 'El motivo debe tener al menos 5 caracteres').max(255, 'El motivo no puede exceder 255 caracteres')
});

export const perdonarSancionSchema = z.object({
  motivoPerdon: z.string().trim().min(3, 'La justificación de levantamiento debe tener al menos 3 caracteres').max(255, 'La justificación no puede exceder 255 caracteres').optional()
});

export type CrearSancionManualInput = z.infer<typeof crearSancionManualSchema>;
export type PerdonarSancionInput = z.infer<typeof perdonarSancionSchema>;
