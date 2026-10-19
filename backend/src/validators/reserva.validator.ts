import { z } from 'zod';

export const crearReservaSchema = z.object({
  laboratorioId: z.coerce.number().int().positive('ID de laboratorio inválido'),
  fechaInicio: z.string().min(1, 'fechaInicio es obligatoria'),
  fechaFin: z.string().min(1, 'fechaFin es obligatoria'),
  materia: z.string().min(1, 'El nombre de la materia es obligatorio').max(150),
  cantidadAlumnos: z.coerce.number().int().positive('La cantidad de alumnos debe ser un número entero mayor a 0'),
  motivo: z.string().optional(),
  numeroComputadora: z.coerce.number().int().nonnegative().optional(),
  recurrente: z.boolean().optional().default(false),
  fechaFinSemestre: z.string().optional()
});

export const crearReservaIndividualSchema = z.object({
  numeroComputadora: z.coerce.number().int().positive('Debes seleccionar explícitamente una computadora válida'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
  fechaFin: z.string().min(1, 'La fecha de fin es obligatoria'),
  motivo: z.string().max(255, 'El motivo no puede superar los 255 caracteres').optional().default('')
});

export const cancelarFuerzaMayorSchema = z.object({
  motivo: z.string().min(5, 'El motivo de fuerza mayor debe tener al menos 5 caracteres')
});

export const cancelarReservaPropiaSchema = z.object({
  motivo: z.string().optional()
});

export type CrearReservaInput = z.infer<typeof crearReservaSchema>;
export type CrearReservaIndividualInput = z.infer<typeof crearReservaIndividualSchema>;
