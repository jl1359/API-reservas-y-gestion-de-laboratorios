import { z } from 'zod';

export const ListarLaboratoriosQuerySchema = z.object({
  estado: z.string().optional(),
  capacidadMin: z.coerce.number().int().positive().optional(),
  buscar: z.string().optional(),
});

export const CalendarioQuerySchema = z.object({
  desde: z.string().datetime({ message: 'Formato ISO requerido para desde (ej: 2026-09-01T00:00:00.000Z)' }).optional(),
  hasta: z.string().datetime({ message: 'Formato ISO requerido para hasta (ej: 2026-09-30T23:59:59.000Z)' }).optional(),
});

export type ListarLaboratoriosQuery = z.infer<typeof ListarLaboratoriosQuerySchema>;
export type CalendarioQuery = z.infer<typeof CalendarioQuerySchema>;
