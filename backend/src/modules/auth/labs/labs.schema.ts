//VALIDACION DE DATOS
import { z } from 'zod';

export const createLabSchema = z.object({
  body: z.object({
    name: z.string({ message: "El nombre del laboratorio es obligatorio" }),
capacity: z.number({ message: "La capacidad es obligatoria" }).int().positive("La capacidad debe ser mayor a 0"),
    location: z.string().optional(),
    status: z.string().optional(),
  }),
});

export type CreateLabInput = z.infer<typeof createLabSchema>['body'];