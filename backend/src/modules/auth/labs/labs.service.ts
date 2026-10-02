// PARTE LOGICA DEL SERVICIO DE INTERACCION CON EL PRISMA
import { prisma } from '../../../config/database';
import { CreateLabInput } from './labs.schema';

export async function createLab(data: CreateLabInput) {
  // Nota: Ajustamos los nombres para que coincidan con los campos de tu modelo de Prisma
  const lab = await prisma.laboratorio.create({
    data: {
      nombre: data.name,            // Se mapea a la columna 'nombre'
      capacidad: data.capacity,     // Se mapea a la columna 'capacidad'
      estadoOperativo: data.status, // Se mapea a la columna 'estado_operativo' (si lo mandan)
    },
  });

  return lab;
}