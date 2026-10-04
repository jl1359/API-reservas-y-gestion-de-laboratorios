import { z } from 'zod';

export const crearEsquemaLab = z.object({
  name: z.string({ message: "El nombre del laboratorio es obligatorio" }),
  capacity: z.number({ message: "La capacidad es obligatoria" }).int().positive("La capacidad debe ser mayor a 0"),
  location: z.string().optional(),
  status: z.string().optional(),
});

export const actualizarEsquemaLab = crearEsquemaLab.partial();

export type CrearLabInput = z.infer<typeof crearEsquemaLab>;
export type ActualizarLabInput = z.infer<typeof actualizarEsquemaLab>;