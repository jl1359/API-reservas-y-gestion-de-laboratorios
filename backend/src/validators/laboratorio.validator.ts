import { z } from 'zod';

export const cambiarEstadoOperativoSchema = z.object({
  estadoOperativo: z.enum(['Activo', 'Mantenimiento', 'Inactivo'] as const)
});

export const registrarMantenimientoSchema = z.object({
  laboratorioId: z.coerce.number().int().positive('El ID de laboratorio es obligatorio'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
  motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres')
});