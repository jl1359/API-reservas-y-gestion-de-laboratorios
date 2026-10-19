import { z } from 'zod';

export const cambiarRolSchema = z.object({
  rolId: z.coerce.number().int().positive('El ID del rol debe ser un entero positivo'),
  motivo: z.string().optional()
});

export const cambiarEstadoUsuarioSchema = z.object({
  activo: z.boolean()
});

export const actualizarPerfilSchema = z.object({
  nombreCompleto: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').optional(),
  telefono: z.string().regex(/^[0-9+ -]{7,20}$/, 'Formato de teléfono inválido').optional().nullable()
});
