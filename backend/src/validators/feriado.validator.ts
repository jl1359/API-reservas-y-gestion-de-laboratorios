import { z } from 'zod';

export const feriadoSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria (formato YYYY-MM-DD o ISO8601)'),
  motivo: z.string().min(2, 'El motivo del feriado o bloqueo debe tener al menos 2 caracteres').max(150, 'Máximo 150 caracteres'),
  bloqueoActivo: z.boolean().optional().default(true)
});

export type FeriadoInput = z.infer<typeof feriadoSchema>;