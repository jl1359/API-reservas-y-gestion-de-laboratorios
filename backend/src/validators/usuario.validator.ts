import { z } from 'zod';

export const cambiarRolSchema = z.object({
  rolId: z.coerce.number().int().positive('El ID del rol debe ser un entero positivo'),
  motivo: z.string().optional()
});

export const cambiarEstadoUsuarioSchema = z.object({
  activo: z.boolean(),
  motivo: z.string().optional()
});

export const registroSchema = z.object({
  nombreCompleto: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  correo: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  ci: z.string().min(5, 'La Cédula de Identidad (CI) es obligatoria y debe tener al menos 5 caracteres').max(20, 'El CI no debe exceder 20 caracteres'),
  telefono: z.string().regex(/^[0-9+ -]{7,20}$/, 'El número de celular/teléfono es obligatorio y debe tener entre 7 y 20 caracteres válidos'),
  carreraId: z.coerce.number().optional()
});

export const actualizarPerfilSchema = z.object({
  nombreCompleto: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').optional(),
  ci: z.string().min(5, 'El CI debe tener al menos 5 caracteres').max(20, 'El CI no debe exceder 20 caracteres').optional().nullable(),
  telefono: z.string().regex(/^[0-9+ -]{7,20}$/, 'Formato de teléfono inválido').optional().nullable(),
  carreraId: z.coerce.number().optional().nullable()
});

export const loginSchema = z.object({
  correo: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria')
});